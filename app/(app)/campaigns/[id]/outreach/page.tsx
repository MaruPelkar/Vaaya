'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';

interface Participant {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  first_name: string | null;
  job_title: string | null;
  company_name: string | null;
}

interface CampaignParticipant {
  id: string;
  status: string;
  contacted_at: string | null;
  responded_at: string | null;
  participant: Participant;
  outreach_logs?: OutreachLog[];
}

interface OutreachLog {
  id: string;
  channel: 'email' | 'call' | 'sms' | 'linkedin';
  status: string;
  sent_at: string;
  response_at: string | null;
  content: Record<string, string>;
}

interface Template {
  id: string;
  type: string;
  name: string;
  description: string | null;
  subject: string | null;
  body: string;
  variables: Array<{ name: string; description: string }>;
}

interface Campaign {
  id: string;
  name: string;
  client: { name: string };
}

type TabType = 'queue' | 'sent' | 'compose';

export default function OutreachPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [participants, setParticipants] = useState<CampaignParticipant[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('queue');

  // Compose state
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [channel, setChannel] = useState<'email' | 'call'>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [personalizing, setPersonalizing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      const supabase = createBrowserClient();

      // Fetch campaign
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('id, name, client:clients(name)')
        .eq('id', params.id)
        .single();

      if (campaignData) {
        // Handle Supabase returning client as array or object
        const clientData = campaignData.client;
        const client = Array.isArray(clientData) ? clientData[0] : clientData;
        setCampaign({
          id: campaignData.id,
          name: campaignData.name,
          client: client as { name: string },
        });
      }

      // Fetch participants
      const { data: cpData } = await supabase
        .from('campaign_participants')
        .select(`
          id,
          status,
          contacted_at,
          responded_at,
          participant:participants(
            id,
            email,
            phone,
            full_name,
            first_name,
            job_title,
            company_name
          )
        `)
        .eq('campaign_id', params.id)
        .order('created_at', { ascending: false });

      if (cpData) {
        // Transform data to handle Supabase relation format
        const transformed = cpData.map(cp => {
          const participantData = cp.participant;
          const participant = Array.isArray(participantData) ? participantData[0] : participantData;
          return {
            ...cp,
            participant: participant as Participant,
          };
        });
        setParticipants(transformed as CampaignParticipant[]);
      }

      // Fetch templates
      const res = await fetch('/api/outreach/templates?type=email');
      const templatesData = await res.json();
      if (templatesData.success) {
        setTemplates(templatesData.templates);
        if (templatesData.templates.length > 0) {
          selectTemplate(templatesData.templates[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function selectTemplate(template: Template) {
    setSelectedTemplate(template);
    setSubject(template.subject || '');
    setBody(template.body);
  }

  function toggleParticipant(cpId: string) {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(cpId)) {
      newSelected.delete(cpId);
    } else {
      newSelected.add(cpId);
    }
    setSelectedParticipants(newSelected);
  }

  function selectAllQueue() {
    const queueParticipants = participants.filter(
      p => !p.contacted_at && (channel === 'email' ? p.participant.email : p.participant.phone)
    );
    setSelectedParticipants(new Set(queueParticipants.map(p => p.id)));
  }

  async function handlePersonalize() {
    if (selectedParticipants.size !== 1) {
      alert('Select exactly one participant to personalize for');
      return;
    }

    setPersonalizing(true);
    try {
      const cpId = Array.from(selectedParticipants)[0];
      const res = await fetch('/api/outreach/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignParticipantId: cpId,
          templateSubject: subject,
          templateBody: body,
          channel,
          tone: 'friendly',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.personalized.subject) {
          setSubject(data.personalized.subject);
        }
        setBody(data.personalized.body);
      } else {
        alert(data.error || 'Personalization failed');
      }
    } catch (error) {
      console.error('Personalization error:', error);
      alert('Failed to personalize message');
    } finally {
      setPersonalizing(false);
    }
  }

  async function handleSend() {
    if (selectedParticipants.size === 0) {
      alert('Select at least one participant');
      return;
    }

    if (!subject && channel === 'email') {
      alert('Please enter an email subject');
      return;
    }

    if (!body) {
      alert('Please enter a message body');
      return;
    }

    const confirmed = confirm(
      `Send ${channel === 'email' ? 'email' : 'call'} to ${selectedParticipants.size} participant(s)?`
    );
    if (!confirmed) return;

    setSending(true);
    setSendProgress({ sent: 0, total: selectedParticipants.size });

    const endpoint = channel === 'email' ? '/api/outreach/email' : '/api/outreach/call';
    let sent = 0;

    for (const cpId of selectedParticipants) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignParticipantId: cpId,
            templateId: selectedTemplate?.id,
            subject,
            body,
            script: body, // For calls
          }),
        });
        sent++;
        setSendProgress({ sent, total: selectedParticipants.size });
      } catch (error) {
        console.error(`Error sending to ${cpId}:`, error);
      }
    }

    setSending(false);
    setSelectedParticipants(new Set());
    fetchData(); // Refresh data
    alert(`Sent ${sent}/${selectedParticipants.size} messages`);
  }

  const queueParticipants = participants.filter(p => !p.contacted_at);
  const contactedParticipants = participants.filter(p => p.contacted_at);

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Campaigns', href: '/campaigns' }, { label: 'Loading...' }]}>
        <div className="animate-pulse">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Campaigns', href: '/campaigns' }, { label: 'Not Found' }]}>
        <div className="empty-state">
          <h3 className="empty-state-title">Campaign not found</h3>
          <Link href="/campaigns" className="btn btn-primary mt-4">
            Back to Campaigns
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Campaigns', href: '/campaigns' },
        { label: campaign.name, href: `/campaigns/${campaign.id}` },
        { label: 'Outreach' },
      ]}
    >
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Outreach</h1>
          <p className="page-description">
            Send personalized emails and calls to participants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/campaigns/${campaign.id}`} className="btn btn-secondary">
            Back to Campaign
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="stat-value">{queueParticipants.length}</div>
          <div className="stat-label">In Queue</div>
        </div>
        <div className="card p-4">
          <div className="stat-value">{contactedParticipants.length}</div>
          <div className="stat-label">Contacted</div>
        </div>
        <div className="card p-4">
          <div className="stat-value">
            {participants.filter(p => p.responded_at).length}
          </div>
          <div className="stat-label">Responded</div>
        </div>
        <div className="card p-4">
          <div className="stat-value">
            {participants.length > 0
              ? Math.round(
                  (participants.filter(p => p.responded_at).length /
                    participants.length) *
                    100
                )
              : 0}%
          </div>
          <div className="stat-label">Response Rate</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <button
          className={`tab ${activeTab === 'queue' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          Queue ({queueParticipants.length})
        </button>
        <button
          className={`tab ${activeTab === 'sent' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({contactedParticipants.length})
        </button>
        <button
          className={`tab ${activeTab === 'compose' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('compose')}
        >
          Compose
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Participant List */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="card-title">
              {activeTab === 'queue' ? 'Outreach Queue' : activeTab === 'sent' ? 'Sent Outreach' : 'Select Recipients'}
            </h3>
            {activeTab === 'queue' && queueParticipants.length > 0 && (
              <button className="btn btn-sm btn-secondary" onClick={selectAllQueue}>
                Select All ({queueParticipants.filter(p => channel === 'email' ? p.participant.email : p.participant.phone).length})
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {(activeTab === 'queue' ? queueParticipants : contactedParticipants).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {activeTab === 'queue' ? 'No participants in queue' : 'No outreach sent yet'}
              </div>
            ) : (
              (activeTab === 'queue' ? queueParticipants : contactedParticipants).map(cp => (
                <div
                  key={cp.id}
                  className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${
                    selectedParticipants.has(cp.id) ? 'bg-green-50' : ''
                  }`}
                  onClick={() => toggleParticipant(cp.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedParticipants.has(cp.id)}
                    onChange={() => toggleParticipant(cp.id)}
                    className="checkbox"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {cp.participant.full_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {cp.participant.job_title} at {cp.participant.company_name}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {cp.participant.email ? '✉' : ''}{' '}
                    {cp.participant.phone ? '☏' : ''}
                  </div>
                  {cp.contacted_at && (
                    <span className={`badge badge-sm ${cp.responded_at ? 'badge-success' : 'badge-neutral'}`}>
                      {cp.responded_at ? 'Responded' : 'Contacted'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {selectedParticipants.size > 0 && (
            <div className="card-footer">
              <span className="text-sm text-gray-600">
                {selectedParticipants.size} selected
              </span>
            </div>
          )}
        </div>

        {/* Right: Compose Area */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Compose Message</h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Channel Toggle */}
            <div>
              <label className="label">Channel</label>
              <div className="flex gap-2">
                <button
                  className={`btn ${channel === 'email' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setChannel('email')}
                >
                  Email
                </button>
                <button
                  className={`btn ${channel === 'call' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setChannel('call')}
                >
                  Voice Call
                </button>
              </div>
            </div>

            {/* Template Select */}
            <div>
              <label className="label">Template</label>
              <select
                className="input"
                value={selectedTemplate?.id || ''}
                onChange={e => {
                  const t = templates.find(t => t.id === e.target.value);
                  if (t) selectTemplate(t);
                }}
              >
                <option value="">-- Select Template --</option>
                {templates
                  .filter(t => (channel === 'email' ? t.type === 'email' : t.type === 'call_script'))
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.description ? `- ${t.description}` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Subject (Email only) */}
            {channel === 'email' && (
              <div>
                <label className="label">Subject</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Email subject line..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
            )}

            {/* Body */}
            <div>
              <label className="label">{channel === 'email' ? 'Body' : 'Call Script'}</label>
              <textarea
                className="input min-h-[200px] font-mono text-sm"
                placeholder={channel === 'email' ? 'Email body...' : 'Call script instructions...'}
                value={body}
                onChange={e => setBody(e.target.value)}
              />
              <p className="form-hint mt-1">
                Use {'{{variable}}'} for personalization: first_name, job_title, company_name, client_name, etc.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                className="btn btn-secondary flex-1"
                onClick={handlePersonalize}
                disabled={personalizing || selectedParticipants.size !== 1}
              >
                {personalizing ? 'Personalizing...' : 'AI Personalize'}
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={handleSend}
                disabled={sending || selectedParticipants.size === 0}
              >
                {sending
                  ? `Sending ${sendProgress.sent}/${sendProgress.total}...`
                  : `Send ${channel === 'email' ? 'Email' : 'Call'} (${selectedParticipants.size})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

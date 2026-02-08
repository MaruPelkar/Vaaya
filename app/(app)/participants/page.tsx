'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/db';
import type { Participant } from '@/lib/types/research';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch =
      participant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || participant.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const sources = [...new Set(participants.map((p) => p.source).filter(Boolean))];

  return (
    <AppLayout breadcrumbs={[{ label: 'Participants' }]}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Participants</h1>
          <p className="page-description">Global pool of research participants across all campaigns</p>
        </div>
        <Link href="/participants/new" className="btn btn-primary">
          Add Participant
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <div className="metric-label">Total Participants</div>
          <div className="metric-value">{participants.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">With Email</div>
          <div className="metric-value">
            {participants.filter((p) => p.email).length}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">With Phone</div>
          <div className="metric-value">
            {participants.filter((p) => p.phone).length}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Completed Sessions</div>
          <div className="metric-value">
            {participants.reduce((acc, p) => acc + (p.total_sessions || 0), 0)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            className="input input-sm w-80"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-divider" />
        <div className="filter-group">
          <span className="filter-label">Source</span>
          <select
            className="select"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participants Table */}
      {loading ? (
        <div className="table-container">
          <div className="p-8">
            <div className="skeleton h-8 w-full mb-4" />
            <div className="skeleton h-8 w-full mb-4" />
            <div className="skeleton h-8 w-full" />
          </div>
        </div>
      ) : filteredParticipants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="empty-state-title">No participants found</h3>
          <p className="empty-state-text">
            {searchQuery || sourceFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add participants manually or discover them through campaigns'}
          </p>
          {!searchQuery && sourceFilter === 'all' && (
            <Link href="/participants/new" className="btn btn-primary">
              Add Participant
            </Link>
          )}
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Title</th>
                  <th>Source</th>
                  <th>Sessions</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant) => (
                  <tr key={participant.id}>
                    <td>
                      <Link
                        href={`/participants/${participant.id}`}
                        className="font-medium text-gray-900 no-underline hover:underline"
                      >
                        {participant.full_name}
                      </Link>
                    </td>
                    <td>
                      <div className="text-sm">
                        {participant.email && (
                          <a href={`mailto:${participant.email}`} className="text-gray-600 hover:underline block">
                            {participant.email}
                          </a>
                        )}
                        {participant.phone && (
                          <span className="text-gray-400 text-xs">{participant.phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-gray-600">{participant.company_name || '-'}</td>
                    <td className="text-gray-600 text-sm">{participant.job_title || '-'}</td>
                    <td>
                      {participant.source ? (
                        <span className="badge badge-neutral">{participant.source}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="font-mono">{participant.total_sessions || 0}</td>
                    <td className="text-gray-500 text-sm">
                      {new Date(participant.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

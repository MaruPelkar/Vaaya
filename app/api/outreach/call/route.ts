import { NextRequest, NextResponse } from 'next/server';
import { makeCall, buildCallScript, BLAND_VOICES, type BlandVoiceId } from '@/lib/bland';
import { createClient } from '@/lib/db';

interface MakeCallRequest {
  campaignParticipantId: string;
  templateId?: string;
  script: string;
  variables?: Record<string, string>;
  voice?: BlandVoiceId;
  firstSentence?: string;
  maxDuration?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: MakeCallRequest = await request.json();
    const {
      campaignParticipantId,
      templateId,
      script,
      variables = {},
      voice = 'nat',
      firstSentence,
      maxDuration = 300,
    } = body;

    if (!campaignParticipantId || !script) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: campaignParticipantId, script'
      }, { status: 400 });
    }

    const supabase = createClient();

    // Get participant details
    const { data: cp, error: cpError } = await supabase
      .from('campaign_participants')
      .select(`
        id,
        campaign_id,
        participant:participants(
          id,
          phone,
          first_name,
          last_name,
          full_name,
          job_title,
          company_name
        ),
        campaign:campaigns(
          id,
          name,
          client:clients(name)
        )
      `)
      .eq('id', campaignParticipantId)
      .single();

    if (cpError || !cp) {
      return NextResponse.json({
        success: false,
        error: 'Campaign participant not found'
      }, { status: 404 });
    }

    const participantData = cp.participant as unknown;
    const participant = (Array.isArray(participantData) ? participantData[0] : participantData) as {
      id: string;
      phone: string | null;
      first_name: string | null;
      last_name: string | null;
      full_name: string;
      job_title: string | null;
      company_name: string | null;
    } | null;
    const campaignData = cp.campaign as unknown;
    const campaignObj = (Array.isArray(campaignData) ? campaignData[0] : campaignData) as {
      id: string;
      name: string;
      client: { name: string } | { name: string }[] | null;
    } | null;
    const clientData = campaignObj?.client;
    const client = (Array.isArray(clientData) ? clientData[0] : clientData) as { name: string } | null;

    if (!participant?.phone) {
      return NextResponse.json({
        success: false,
        error: 'Participant has no phone number'
      }, { status: 400 });
    }

    // Build variables for script rendering
    const scriptVars: Record<string, string> = {
      first_name: participant?.first_name || participant?.full_name?.split(' ')[0] || 'there',
      last_name: participant?.last_name || '',
      full_name: participant?.full_name || '',
      job_title: participant?.job_title || 'professional',
      company_name: participant?.company_name || 'your company',
      client_name: client?.name || 'our client',
      campaign_name: campaignObj?.name || '',
      ...variables,
    };

    // Build the call script
    const renderedScript = buildCallScript(script, scriptVars);
    const renderedFirstSentence = firstSentence
      ? buildCallScript(firstSentence, scriptVars)
      : undefined;

    // Get base URL for webhook
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    const webhookUrl = baseUrl
      ? `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/outreach/call/webhook`
      : undefined;

    // Make the call
    const result = await makeCall({
      phoneNumber: participant.phone,
      task: renderedScript,
      voice,
      firstSentence: renderedFirstSentence,
      maxDuration,
      metadata: {
        campaign_participant_id: campaignParticipantId,
        campaign_id: cp.campaign_id,
        participant_id: participant.id,
      },
      webhookUrl,
      record: true,
    });

    if (!result.success) {
      // Log failed attempt
      await supabase.from('outreach_logs').insert({
        campaign_participant_id: campaignParticipantId,
        channel: 'call',
        status: 'failed',
        template_id: templateId || null,
        content: { script: renderedScript, voice },
        error_message: result.error,
      });

      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

    // Log call initiation
    const { data: log } = await supabase.from('outreach_logs').insert({
      campaign_participant_id: campaignParticipantId,
      channel: 'call',
      status: 'sent', // Will be updated via webhook
      template_id: templateId || null,
      content: { script: renderedScript, voice },
      external_id: result.callId,
    }).select('id').single();

    // Update participant status if this is first outreach
    await supabase
      .from('campaign_participants')
      .update({
        status: 'contacted',
        contacted_at: new Date().toISOString(),
      })
      .eq('id', campaignParticipantId)
      .is('contacted_at', null);

    // Track estimated cost (Bland AI is ~$0.09/min)
    await supabase.from('cost_tracking').insert({
      campaign_id: cp.campaign_id,
      category: 'outreach_call',
      description: `Call to ${participant.phone}`,
      amount: 0.09 * (maxDuration / 60), // Estimate based on max duration
      external_service: 'bland',
      external_reference: result.callId,
    });

    return NextResponse.json({
      success: true,
      callId: result.callId,
      status: result.status,
      logId: log?.id,
    });
  } catch (error) {
    console.error('[Outreach Call API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get available voices
export async function GET() {
  return NextResponse.json({
    success: true,
    voices: BLAND_VOICES,
  });
}

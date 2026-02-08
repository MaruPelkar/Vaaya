import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db';

// Bland AI webhook payload structure
interface BlandWebhookPayload {
  call_id: string;
  status: 'completed' | 'failed' | 'no-answer' | 'busy';
  call_length?: number; // Duration in seconds
  to?: string;
  from?: string;
  answered_by?: 'human' | 'voicemail' | 'unknown';
  concatenated_transcript?: string;
  summary?: string;
  recording_url?: string;
  end_reason?: string;
  metadata?: {
    campaign_participant_id?: string;
    campaign_id?: string;
    participant_id?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: BlandWebhookPayload = await request.json();
    console.log('[Bland Webhook] Received:', payload.call_id, payload.status);

    const supabase = createClient();

    // Find the outreach log for this call
    const { data: log, error: logError } = await supabase
      .from('outreach_logs')
      .select('id, campaign_participant_id')
      .eq('external_id', payload.call_id)
      .single();

    if (logError || !log) {
      console.error('[Bland Webhook] Log not found for call:', payload.call_id);
      // Return 200 to acknowledge receipt even if we can't find the log
      return NextResponse.json({ received: true });
    }

    // Map Bland status to our status
    let status: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed' = 'delivered';
    if (payload.status === 'completed') {
      status = payload.answered_by === 'human' ? 'delivered' : 'delivered';
      // If they spoke for more than 30 seconds, consider it a conversation
      if (payload.call_length && payload.call_length > 30) {
        status = 'replied';
      }
    } else if (payload.status === 'failed' || payload.status === 'busy' || payload.status === 'no-answer') {
      status = 'failed';
    }

    // Update the outreach log
    await supabase
      .from('outreach_logs')
      .update({
        status,
        response_at: payload.status === 'completed' ? new Date().toISOString() : null,
        response_content: payload.concatenated_transcript ? {
          transcript: payload.concatenated_transcript,
          summary: payload.summary,
          answered_by: payload.answered_by,
          duration: payload.call_length,
          recording_url: payload.recording_url,
        } : null,
      })
      .eq('id', log.id);

    // If call was successful and got a response, update participant status
    if (status === 'replied' && log.campaign_participant_id) {
      await supabase
        .from('campaign_participants')
        .update({
          status: 'responded',
          responded_at: new Date().toISOString(),
        })
        .eq('id', log.campaign_participant_id);
    }

    // Update cost tracking with actual duration
    if (payload.call_length && payload.metadata?.campaign_id) {
      // Bland charges ~$0.09/min
      const actualCost = (payload.call_length / 60) * 0.09;

      // Find and update the cost entry
      const { data: costEntry } = await supabase
        .from('cost_tracking')
        .select('id, amount')
        .eq('external_reference', payload.call_id)
        .single();

      if (costEntry) {
        await supabase
          .from('cost_tracking')
          .update({
            amount: actualCost,
            description: `Call to ${payload.to} (${Math.round(payload.call_length)}s)`,
          })
          .eq('id', costEntry.id);
      }
    }

    // If we got a transcript, we might want to save it as an artifact
    if (payload.concatenated_transcript && log.campaign_participant_id) {
      const { data: existingArtifact } = await supabase
        .from('artifacts')
        .select('id')
        .eq('campaign_participant_id', log.campaign_participant_id)
        .eq('source', 'bland')
        .eq('source_url', payload.recording_url || payload.call_id)
        .single();

      if (!existingArtifact) {
        await supabase.from('artifacts').insert({
          campaign_participant_id: log.campaign_participant_id,
          type: 'transcript',
          name: `Call transcript - ${new Date().toLocaleDateString()}`,
          file_url: payload.recording_url,
          duration_seconds: payload.call_length,
          processing_status: 'completed',
          transcript: payload.concatenated_transcript,
          ai_summary: payload.summary,
          source: 'bland',
          source_url: payload.recording_url || payload.call_id,
        });
      }
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[Bland Webhook] Error:', error);
    // Return 200 to prevent Bland from retrying
    return NextResponse.json({
      received: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

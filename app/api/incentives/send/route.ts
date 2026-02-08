import { NextRequest, NextResponse } from 'next/server';
import { sendReward } from '@/lib/tremendous';
import { createClient } from '@/lib/db';

interface SendIncentiveRequest {
  campaignParticipantId: string;
  amount: number;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendIncentiveRequest = await request.json();
    const { campaignParticipantId, amount, message } = body;

    if (!campaignParticipantId || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: campaignParticipantId, amount'
      }, { status: 400 });
    }

    if (amount < 1 || amount > 500) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be between $1 and $500'
      }, { status: 400 });
    }

    const supabase = createClient();

    // Get participant details
    const { data: cp, error: cpError } = await supabase
      .from('campaign_participants')
      .select(`
        id,
        campaign_id,
        incentive_sent,
        incentive_amount,
        participant:participants(
          id,
          email,
          full_name
        ),
        campaign:campaigns(id, name)
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
      email: string | null;
      full_name: string;
    } | null;

    if (!participant?.email) {
      return NextResponse.json({
        success: false,
        error: 'Participant has no email address'
      }, { status: 400 });
    }

    if (cp.incentive_sent) {
      return NextResponse.json({
        success: false,
        error: 'Incentive already sent to this participant'
      }, { status: 400 });
    }

    // Send the reward via Tremendous
    const result = await sendReward({
      recipientEmail: participant.email,
      recipientName: participant.full_name,
      amount,
      campaignId: cp.campaign_id,
      message,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

    // Update campaign participant record
    await supabase
      .from('campaign_participants')
      .update({
        incentive_sent: true,
        incentive_sent_at: new Date().toISOString(),
        incentive_amount: amount,
        incentive_reference: result.rewardId,
      })
      .eq('id', campaignParticipantId);

    // Track cost
    await supabase.from('cost_tracking').insert({
      campaign_id: cp.campaign_id,
      category: 'incentive',
      description: `Gift card for ${participant.full_name} ($${amount})`,
      amount: amount + (amount * 0.05), // Tremendous fee is ~5%
      external_service: 'tremendous',
      external_reference: result.rewardId,
    });

    return NextResponse.json({
      success: true,
      rewardId: result.rewardId,
      orderId: result.orderId,
      status: result.status,
    });
  } catch (error) {
    console.error('[Incentives API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

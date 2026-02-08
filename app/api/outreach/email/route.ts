import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, renderTemplate, wrapInHtml } from '@/lib/resend';
import { createClient } from '@/lib/db';

interface SendEmailRequest {
  campaignParticipantId: string;
  templateId?: string;
  subject: string;
  body: string;
  variables?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const { campaignParticipantId, templateId, subject, body: emailBody, variables = {} } = body;

    if (!campaignParticipantId || !subject || !emailBody) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: campaignParticipantId, subject, body'
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
          email,
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
      email: string | null;
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

    if (!participant?.email) {
      return NextResponse.json({
        success: false,
        error: 'Participant has no email address'
      }, { status: 400 });
    }

    // Build variables for template rendering
    const templateVars: Record<string, string> = {
      first_name: participant.first_name || participant.full_name?.split(' ')[0] || 'there',
      last_name: participant.last_name || '',
      full_name: participant.full_name || '',
      job_title: participant.job_title || 'professional',
      company_name: participant.company_name || 'your company',
      client_name: client?.name || 'our client',
      campaign_name: campaignObj?.name || '',
      ...variables,
    };

    // Render template with variables
    const renderedSubject = renderTemplate(subject, templateVars);
    const renderedBody = renderTemplate(emailBody, templateVars);
    const htmlBody = wrapInHtml(renderedBody);

    // Send the email
    const result = await sendEmail({
      to: participant.email,
      subject: renderedSubject,
      html: htmlBody,
      text: renderedBody,
      tags: [
        { name: 'campaign_id', value: cp.campaign_id },
        { name: 'participant_id', value: participant.id },
      ],
    });

    if (!result.success) {
      // Log failed attempt
      await supabase.from('outreach_logs').insert({
        campaign_participant_id: campaignParticipantId,
        channel: 'email',
        status: 'failed',
        template_id: templateId || null,
        content: { subject: renderedSubject, body: renderedBody },
        error_message: result.error,
      });

      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

    // Log successful send
    const { data: log } = await supabase.from('outreach_logs').insert({
      campaign_participant_id: campaignParticipantId,
      channel: 'email',
      status: 'sent',
      template_id: templateId || null,
      content: { subject: renderedSubject, body: renderedBody },
      external_id: result.id,
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

    // Track cost (Resend is ~$0.001 per email after free tier)
    await supabase.from('cost_tracking').insert({
      campaign_id: cp.campaign_id,
      category: 'outreach_email',
      description: `Email to ${participant.email}`,
      amount: 0.001,
      external_service: 'resend',
      external_reference: result.id,
    });

    return NextResponse.json({
      success: true,
      emailId: result.id,
      logId: log?.id,
    });
  } catch (error) {
    console.error('[Outreach Email API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

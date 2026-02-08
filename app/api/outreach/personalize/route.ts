import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/openai';
import { createClient } from '@/lib/db';

interface PersonalizeRequest {
  campaignParticipantId?: string;
  templateBody: string;
  templateSubject?: string;
  context?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    jobTitle?: string;
    company?: string;
    linkedinUrl?: string;
    industry?: string;
    clientName?: string;
    researchTopic?: string;
    incentiveAmount?: string;
    customContext?: string;
  };
  tone?: 'professional' | 'casual' | 'friendly' | 'direct';
  channel?: 'email' | 'call';
}

export async function POST(request: NextRequest) {
  try {
    const body: PersonalizeRequest = await request.json();
    const {
      campaignParticipantId,
      templateBody,
      templateSubject,
      context = {},
      tone = 'friendly',
      channel = 'email',
    } = body;

    if (!templateBody) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: templateBody'
      }, { status: 400 });
    }

    let participantContext = context;

    // If campaignParticipantId provided, fetch participant details
    if (campaignParticipantId) {
      const supabase = createClient();
      const { data: cp } = await supabase
        .from('campaign_participants')
        .select(`
          participant:participants(
            first_name,
            last_name,
            full_name,
            job_title,
            company_name,
            linkedin_url,
            raw_data
          ),
          campaign:campaigns(
            name,
            research_goals,
            client:clients(name, industry)
          )
        `)
        .eq('id', campaignParticipantId)
        .single();

      if (cp) {
        const participantData = cp.participant as unknown;
        const participant = (Array.isArray(participantData) ? participantData[0] : participantData) as {
          first_name: string | null;
          last_name: string | null;
          full_name: string;
          job_title: string | null;
          company_name: string | null;
          linkedin_url: string | null;
          raw_data: Record<string, unknown> | null;
        } | null;
        const campaignData = cp.campaign as unknown;
        const campaignObj = (Array.isArray(campaignData) ? campaignData[0] : campaignData) as {
          name: string;
          research_goals: string[] | null;
          client: { name: string; industry: string | null } | { name: string; industry: string | null }[] | null;
        } | null;
        const clientData = campaignObj?.client;
        const client = (Array.isArray(clientData) ? clientData[0] : clientData) as { name: string; industry: string | null } | null;

        participantContext = {
          ...context,
          firstName: participant?.first_name || participant?.full_name?.split(' ')[0],
          lastName: participant?.last_name || '',
          fullName: participant?.full_name,
          jobTitle: participant?.job_title || undefined,
          company: participant?.company_name || undefined,
          linkedinUrl: participant?.linkedin_url || undefined,
          clientName: client?.name || undefined,
          industry: client?.industry || undefined,
          researchTopic: campaignObj?.research_goals?.[0] || campaignObj?.name,
        };
      }
    }

    // Build the prompt for personalization
    const systemPrompt = `You are a skilled copywriter specializing in research recruitment outreach. Your job is to personalize ${channel === 'email' ? 'email' : 'call script'} templates to make them feel personal and relevant while maintaining the core message.

Guidelines:
- Maintain a ${tone} tone throughout
- Make specific references to the person's role, company, or background when available
- Keep the personalization subtle and natural - don't force it
- Preserve all template variables like {{first_name}} or {{incentive_amount}} that should remain as placeholders
- The goal is to get someone interested in participating in user research
- Be concise - don't add unnecessary fluff
- If you don't have enough context for meaningful personalization, make minimal changes

Output ONLY the personalized content, no explanations or preamble.`;

    const contextDescription = Object.entries(participantContext)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const userPrompt = `Personalize this ${channel === 'email' ? 'email' : 'call script'} for the following person:

Context:
${contextDescription || 'No specific context available - make minimal changes'}

${templateSubject ? `Subject line template:\n${templateSubject}\n\n` : ''}Body template:
${templateBody}

${templateSubject ? 'Output both personalized subject and body.' : 'Output the personalized body.'}`;

    const personalizedContent = await generateText(userPrompt, systemPrompt, {
      temperature: 0.7,
      maxTokens: 1500,
    });

    if (!personalizedContent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate personalized content'
      }, { status: 500 });
    }

    // Parse subject and body if both were requested
    let personalizedSubject: string | undefined;
    let personalizedBody = personalizedContent;

    if (templateSubject) {
      // Try to extract subject from response
      const subjectMatch = personalizedContent.match(/^(?:Subject(?:\s*line)?:?\s*)(.+?)(?:\n|$)/im);
      if (subjectMatch) {
        personalizedSubject = subjectMatch[1].trim();
        personalizedBody = personalizedContent.replace(subjectMatch[0], '').trim();
      }

      // Also try "Body:" marker
      const bodyMatch = personalizedBody.match(/^(?:Body:?\s*)/im);
      if (bodyMatch) {
        personalizedBody = personalizedBody.replace(bodyMatch[0], '').trim();
      }
    }

    return NextResponse.json({
      success: true,
      personalized: {
        subject: personalizedSubject,
        body: personalizedBody,
      },
      original: {
        subject: templateSubject,
        body: templateBody,
      },
    });
  } catch (error) {
    console.error('[Personalize API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

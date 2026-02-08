import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db';
import type { NynePersonResult } from '@/lib/nyne';

interface ImportPerson extends NynePersonResult {
  fit_score?: number;
  fit_reasoning?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignId,
      people,
    }: {
      campaignId: string;
      people: ImportPerson[];
    } = body;

    if (!campaignId || !people?.length) {
      return NextResponse.json({
        success: false,
        error: 'Missing campaignId or people'
      }, { status: 400 });
    }

    const supabase = createClient();
    const imported: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const person of people) {
      try {
        // Check if participant already exists by email
        let participantId: string;

        if (person.email) {
          const { data: existing } = await supabase
            .from('participants')
            .select('id')
            .eq('email', person.email)
            .single();

          if (existing) {
            participantId = existing.id;
          } else {
            // Create new participant
            const { data: newParticipant, error: createError } = await supabase
              .from('participants')
              .insert({
                full_name: person.name,
                first_name: person.name.split(' ')[0],
                last_name: person.name.split(' ').slice(1).join(' '),
                email: person.email,
                phone: person.phone,
                linkedin_url: person.linkedin_url,
                job_title: person.title,
                company_name: person.company,
                source: 'nyne',
                raw_data: person,
              })
              .select('id')
              .single();

            if (createError) throw createError;
            participantId = newParticipant.id;
          }
        } else {
          // No email - create participant anyway but they might be duplicates
          const { data: newParticipant, error: createError } = await supabase
            .from('participants')
            .insert({
              full_name: person.name,
              first_name: person.name.split(' ')[0],
              last_name: person.name.split(' ').slice(1).join(' '),
              phone: person.phone,
              linkedin_url: person.linkedin_url,
              job_title: person.title,
              company_name: person.company,
              source: 'nyne',
              raw_data: person,
            })
            .select('id')
            .single();

          if (createError) throw createError;
          participantId = newParticipant.id;
        }

        // Check if already in campaign
        const { data: existingCp } = await supabase
          .from('campaign_participants')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('participant_id', participantId)
          .single();

        if (existingCp) {
          skipped.push(person.name);
          continue;
        }

        // Add to campaign
        const { error: cpError } = await supabase
          .from('campaign_participants')
          .insert({
            campaign_id: campaignId,
            participant_id: participantId,
            status: 'discovered',
            fit_score: person.fit_score,
            fit_reasoning: person.fit_reasoning,
          });

        if (cpError) throw cpError;
        imported.push(person.name);

      } catch (error) {
        console.error(`[Import] Error importing ${person.name}:`, error);
        errors.push(`${person.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      details: {
        imported,
        skipped,
        errors,
      },
    });
  } catch (error) {
    console.error('[Import API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

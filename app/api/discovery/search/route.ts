import { NextRequest, NextResponse } from 'next/server';
import { searchPeopleAtCompany, searchPeopleAtCompanies, NynePersonResult } from '@/lib/nyne';
import { createClient } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mode = 'company', // 'company' | 'companies' | 'titles'
      company,
      companies,
      titles = ['Product Manager', 'Engineering Manager', 'CTO'],
      limit = 10,
      campaignId,
    } = body;

    let results: NynePersonResult[] = [];

    if (mode === 'company' && company) {
      // Search for people at a single company
      const response = await searchPeopleAtCompany(company, titles, { limit });
      if (response.success && response.people) {
        results = response.people;
      } else {
        return NextResponse.json({
          success: false,
          error: response.error || 'Search failed'
        }, { status: 400 });
      }
    } else if (mode === 'companies' && companies?.length > 0) {
      // Search for people at multiple companies
      const response = await searchPeopleAtCompanies(
        companies.map((c: string) => ({ name: c })),
        titles,
        { limitPerCompany: Math.ceil(limit / companies.length) }
      );
      if (response.success && response.people) {
        results = response.people;
      } else {
        return NextResponse.json({
          success: false,
          error: response.error || 'Search failed'
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid search mode or missing parameters'
      }, { status: 400 });
    }

    // If campaignId provided, check for duplicates in the campaign
    if (campaignId && results.length > 0) {
      const supabase = createClient();

      // Get existing participant emails in this campaign
      const { data: existingParticipants } = await supabase
        .from('campaign_participants')
        .select('participant:participants(email)')
        .eq('campaign_id', campaignId);

      const existingEmails = new Set<string>();
      if (existingParticipants) {
        for (const cp of existingParticipants) {
          // Supabase returns nested relation as array or object depending on cardinality
          const participant = cp.participant as unknown as { email: string | null } | { email: string | null }[] | null;
          if (participant) {
            const email = Array.isArray(participant) ? participant[0]?.email : participant.email;
            if (email) {
              existingEmails.add(email.toLowerCase());
            }
          }
        }
      }

      // Mark duplicates
      results = results.map(person => ({
        ...person,
        isDuplicate: person.email ? existingEmails.has(person.email.toLowerCase()) : false,
      }));
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      people: results,
    });
  } catch (error) {
    console.error('[Discovery API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

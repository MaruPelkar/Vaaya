import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db';
import { executeTab1Strategies } from '@/lib/strategies/tab1';
import { executeTab2Strategies } from '@/lib/strategies/tab2';
import { executeTab3Strategies } from '@/lib/strategies/tab3';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;
  const { tab } = await request.json();

  if (![1, 2, 3].includes(tab)) {
    return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
  }

  const supabase = createClient();

  // Get company name
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('domain', domain)
    .single();

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  // Execute the appropriate strategy
  let result;
  let updateData: Record<string, unknown> = {};

  switch (tab) {
    case 1:
      result = await executeTab1Strategies(domain, company.name);
      updateData = {
        tab1_data: result.data,
        tab1_updated_at: new Date().toISOString(),
        tab1_sources: result.sources,
      };
      break;
    case 2:
      result = await executeTab2Strategies(domain, company.name);
      updateData = {
        tab2_data: result.data,
        tab2_updated_at: new Date().toISOString(),
        tab2_sources: result.sources,
      };
      break;
    case 3:
      result = await executeTab3Strategies(domain, company.name);
      updateData = {
        tab3_data: result.data,
        tab3_updated_at: new Date().toISOString(),
        tab3_sources: result.sources,
      };
      break;
  }

  // Update database
  await supabase
    .from('companies')
    .update(updateData)
    .eq('domain', domain);

  return NextResponse.json({
    data: result?.data,
    updated_at: updateData[`tab${tab}_updated_at`],
    sources: result?.sources,
  });
}

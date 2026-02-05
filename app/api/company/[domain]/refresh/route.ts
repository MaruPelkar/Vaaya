import { NextRequest } from 'next/server';
import { createClient } from '@/lib/db';
import { executeDashboardStrategies } from '@/lib/strategies/dashboard';
import { executeProductStrategies } from '@/lib/strategies/product';
import { executeBusinessStrategies } from '@/lib/strategies/business';
import {
  TabId,
  getEmptyPersonData,
} from '@/lib/types';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;
  const { tab } = await request.json() as { tab: TabId };
  const supabase = createClient();

  // Get company name from database
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('domain', domain)
    .single();

  const companyName = company?.name || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  try {
    let result: { data: unknown; sources: string[] };

    switch (tab) {
      case 'dashboard':
        result = await executeDashboardStrategies(domain, companyName);
        await supabase.from('companies').update({
          dashboard_data: result.data,
          dashboard_updated_at: new Date().toISOString(),
          dashboard_sources: result.sources,
        }).eq('domain', domain);
        break;

      case 'product':
        result = await executeProductStrategies(domain, companyName);
        await supabase.from('companies').update({
          product_data: result.data,
          product_updated_at: new Date().toISOString(),
          product_sources: result.sources,
        }).eq('domain', domain);
        break;

      case 'business':
        result = await executeBusinessStrategies(domain, companyName);
        await supabase.from('companies').update({
          business_data: result.data,
          business_updated_at: new Date().toISOString(),
          business_sources: result.sources,
        }).eq('domain', domain);
        break;

      case 'person':
        // TODO: Implement person strategies
        result = { data: getEmptyPersonData(), sources: [] };
        await supabase.from('companies').update({
          person_data: result.data,
          person_updated_at: new Date().toISOString(),
          person_sources: result.sources,
        }).eq('domain', domain);
        break;

      default:
        return Response.json({ error: 'Invalid tab' }, { status: 400 });
    }

    return Response.json({
      data: result.data,
      updated_at: new Date().toISOString(),
      sources: result.sources,
    });
  } catch (error) {
    console.error(`Refresh ${tab} error:`, error);
    return Response.json({ error: `Failed to refresh ${tab} data` }, { status: 500 });
  }
}

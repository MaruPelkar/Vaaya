import { NextRequest } from 'next/server';
import { createClient } from '@/lib/db';
import { executeDashboardStrategies } from '@/lib/strategies/dashboard';
import { executeProductStrategies } from '@/lib/strategies/product';
import { executeBusinessStrategies } from '@/lib/strategies/business';
import {
  TabId,
  getEmptyProductData,
  getEmptyBusinessData,
  getEmptyPersonData,
} from '@/lib/types';

export const maxDuration = 60; // Vercel function timeout

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;
  const supabase = createClient();

  // Check if company exists in cache
  const { data: existing } = await supabase
    .from('companies')
    .select('*')
    .eq('domain', domain)
    .single();

  if (existing && existing.dashboard_updated_at) {
    // Return cached data
    return Response.json({
      company: {
        domain: existing.domain,
        name: existing.name,
        logo_url: existing.logo_url,
      },
      dashboard: {
        data: existing.dashboard_data,
        updated_at: existing.dashboard_updated_at,
        sources: existing.dashboard_sources || [],
      },
      product: {
        data: existing.product_data || getEmptyProductData(),
        updated_at: existing.product_updated_at,
        sources: existing.product_sources || [],
      },
      business: {
        data: existing.business_data || getEmptyBusinessData(),
        updated_at: existing.business_updated_at,
        sources: existing.business_sources || [],
      },
      person: {
        data: existing.person_data || getEmptyPersonData(),
        updated_at: existing.person_updated_at,
        sources: existing.person_sources || [],
      },
    });
  }

  // No cache - stream results as tabs complete
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send SSE events
  const sendEvent = async (event: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  };

  // Execute all tabs in parallel
  (async () => {
    try {
      // Get company name - use domain as fallback
      const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      const logoUrl = `https://logo.clearbit.com/${domain}`;

      // Send company info immediately
      await sendEvent({ type: 'company_info', name: companyName, logo_url: logoUrl });

      // Create initial record
      await supabase.from('companies').upsert({
        domain: domain,
        name: companyName,
        logo_url: logoUrl,
      });

      // Execute tabs in parallel
      await Promise.allSettled([
        // Dashboard Tab
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 'dashboard' as TabId });
          try {
            const result = await executeDashboardStrategies(domain, companyName);

            await supabase.from('companies').update({
              dashboard_data: result.data,
              dashboard_updated_at: new Date().toISOString(),
              dashboard_sources: result.sources,
            }).eq('domain', domain);

            await sendEvent({
              type: 'tab_complete',
              tab: 'dashboard' as TabId,
              data: result.data,
              sources: result.sources,
            });
          } catch (error) {
            console.error('Dashboard tab error:', error);
            await sendEvent({
              type: 'tab_error',
              tab: 'dashboard' as TabId,
              error: 'Failed to fetch dashboard data',
            });
          }
        })(),

        // Product Tab
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 'product' as TabId });
          try {
            const result = await executeProductStrategies(domain, companyName);

            await supabase.from('companies').update({
              product_data: result.data,
              product_updated_at: new Date().toISOString(),
              product_sources: result.sources,
            }).eq('domain', domain);

            await sendEvent({
              type: 'tab_complete',
              tab: 'product' as TabId,
              data: result.data,
              sources: result.sources,
            });
          } catch (error) {
            console.error('Product tab error:', error);
            await sendEvent({
              type: 'tab_error',
              tab: 'product' as TabId,
              error: 'Failed to fetch product data',
            });
          }
        })(),

        // Business Tab
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 'business' as TabId });
          try {
            const result = await executeBusinessStrategies(domain, companyName);

            await supabase.from('companies').update({
              business_data: result.data,
              business_updated_at: new Date().toISOString(),
              business_sources: result.sources,
            }).eq('domain', domain);

            await sendEvent({
              type: 'tab_complete',
              tab: 'business' as TabId,
              data: result.data,
              sources: result.sources,
            });
          } catch (error) {
            console.error('Business tab error:', error);
            await sendEvent({
              type: 'tab_error',
              tab: 'business' as TabId,
              error: 'Failed to fetch business data',
            });
          }
        })(),

        // Person Tab (placeholder - returns empty data for now)
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 'person' as TabId });
          try {
            const emptyData = getEmptyPersonData();
            await supabase.from('companies').update({
              person_data: emptyData,
              person_updated_at: new Date().toISOString(),
              person_sources: [],
            }).eq('domain', domain);

            await sendEvent({
              type: 'tab_complete',
              tab: 'person' as TabId,
              data: emptyData,
              sources: [],
            });
          } catch (error) {
            console.error('Person tab error:', error);
            await sendEvent({
              type: 'tab_error',
              tab: 'person' as TabId,
              error: 'Failed to fetch person data',
            });
          }
        })(),
      ]);

      await sendEvent({ type: 'all_complete' });
    } catch (error) {
      console.error('Crawl error:', error);
      await sendEvent({ type: 'error', message: 'Failed to fetch company data' });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/db';
import { executeSummaryStrategies } from '@/lib/strategies/summary';
import { executeProductStrategies } from '@/lib/strategies/product';
import { executeBusinessStrategies } from '@/lib/strategies/business';
import {
  TabId,
  getEmptySummaryData,
  getEmptyProductData,
  getEmptyBusinessData,
  getEmptyPeopleData,
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

  if (existing && existing.summary_updated_at) {
    // Return cached data
    return Response.json({
      company: {
        domain: existing.domain,
        name: existing.name,
        logo_url: existing.logo_url,
      },
      summary: {
        data: existing.summary_data,
        updated_at: existing.summary_updated_at,
        sources: existing.summary_sources || [],
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
      people: {
        data: existing.people_data || getEmptyPeopleData(),
        updated_at: existing.people_updated_at,
        sources: existing.people_sources || [],
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
      // Summary, Product, and Business tabs are implemented. People tab returns empty data.
      await Promise.allSettled([
        // Summary Tab
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 'summary' as TabId });
          try {
            const result = await executeSummaryStrategies(domain, companyName);

            await supabase.from('companies').update({
              summary_data: result.data,
              summary_updated_at: new Date().toISOString(),
              summary_sources: result.sources,
            }).eq('domain', domain);

            await sendEvent({
              type: 'tab_complete',
              tab: 'summary' as TabId,
              data: result.data,
              sources: result.sources,
            });
          } catch (error) {
            console.error('Summary tab error:', error);
            await sendEvent({
              type: 'tab_error',
              tab: 'summary' as TabId,
              error: 'Failed to fetch company summary',
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

        // People Tab (placeholder - returns empty data for now)
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 'people' as TabId });
          try {
            const emptyData = getEmptyPeopleData();
            await supabase.from('companies').update({
              people_data: emptyData,
              people_updated_at: new Date().toISOString(),
              people_sources: [],
            }).eq('domain', domain);

            await sendEvent({
              type: 'tab_complete',
              tab: 'people' as TabId,
              data: emptyData,
              sources: [],
            });
          } catch (error) {
            console.error('People tab error:', error);
            await sendEvent({
              type: 'tab_error',
              tab: 'people' as TabId,
              error: 'Failed to fetch people data',
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

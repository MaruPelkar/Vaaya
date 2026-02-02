import { NextRequest } from 'next/server';
import { createClient } from '@/lib/db';
import { executeTab1Strategies } from '@/lib/strategies/tab1';
import { executeTab2Strategies } from '@/lib/strategies/tab2';
import { executeTab3Strategies } from '@/lib/strategies/tab3';

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

  if (existing && existing.tab1_updated_at) {
    // Return cached data
    return Response.json({
      company: {
        domain: existing.domain,
        name: existing.name,
        logo_url: existing.logo_url,
      },
      tab1: {
        data: existing.tab1_data,
        updated_at: existing.tab1_updated_at,
        sources: existing.tab1_sources,
      },
      tab2: {
        data: existing.tab2_data,
        updated_at: existing.tab2_updated_at,
        sources: existing.tab2_sources,
      },
      tab3: {
        data: existing.tab3_data,
        updated_at: existing.tab3_updated_at,
        sources: existing.tab3_sources,
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
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 1 });
          try {
            const result = await executeTab1Strategies(domain, companyName);

            // Update company name from Perplexity results if available
            if (result.data.description) {
              await supabase.from('companies').update({
                tab1_data: result.data,
                tab1_updated_at: new Date().toISOString(),
                tab1_sources: result.sources,
              }).eq('domain', domain);
            }

            await sendEvent({ type: 'tab_complete', tab: 1, data: result.data, sources: result.sources });
          } catch (error) {
            console.error('Tab 1 error:', error);
            await sendEvent({ type: 'tab_error', tab: 1, error: 'Failed to fetch company overview' });
          }
        })(),
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 2 });
          try {
            const result = await executeTab2Strategies(domain, companyName);
            await supabase.from('companies').update({
              tab2_data: result.data,
              tab2_updated_at: new Date().toISOString(),
              tab2_sources: result.sources,
            }).eq('domain', domain);
            await sendEvent({ type: 'tab_complete', tab: 2, data: result.data, sources: result.sources });
          } catch (error) {
            console.error('Tab 2 error:', error);
            await sendEvent({ type: 'tab_error', tab: 2, error: 'Failed to fetch market intelligence' });
          }
        })(),
        (async () => {
          await sendEvent({ type: 'tab_started', tab: 3 });
          try {
            const result = await executeTab3Strategies(domain, companyName);
            await supabase.from('companies').update({
              tab3_data: result.data,
              tab3_updated_at: new Date().toISOString(),
              tab3_sources: result.sources,
            }).eq('domain', domain);
            await sendEvent({ type: 'tab_complete', tab: 3, data: result.data, sources: result.sources });
          } catch (error) {
            console.error('Tab 3 error:', error);
            await sendEvent({ type: 'tab_error', tab: 3, error: 'Failed to fetch user discovery' });
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

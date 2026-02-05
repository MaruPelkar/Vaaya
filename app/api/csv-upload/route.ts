import { NextRequest, NextResponse } from 'next/server';
import { CSVRow, BolnaCallResponse, CSVProcessingResult } from '@/lib/types';

// Bolna AI configuration
const BOLNA_API_KEY = 'bn-39a6c998e60741c7af452259ce3be158';
const BOLNA_AGENT_ID = '84e7c897-a6ea-435a-b859-96a14c560531';
const BOLNA_API_BASE_URL = 'https://api.bolna.dev';

export const runtime = 'edge';

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file must contain headers and at least one data row');
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  // Validate required columns
  const requiredColumns = ['sno', 'name', 'software', 'phone_number'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Get column indices
  const snoIndex = headers.indexOf('sno');
  const nameIndex = headers.indexOf('name');
  const softwareIndex = headers.indexOf('software');
  const phoneIndex = headers.indexOf('phone_number');

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());

    rows.push({
      sno: values[snoIndex] || '',
      name: values[nameIndex] || '',
      software: values[softwareIndex] || '',
      phone_number: values[phoneIndex] || '',
    });
  }

  return rows;
}

async function initiateCallWithBolna(row: CSVRow): Promise<BolnaCallResponse> {
  try {
    const response = await fetch(`${BOLNA_API_BASE_URL}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BOLNA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: BOLNA_AGENT_ID,
        recipient_phone_number: row.phone_number,
        user_data: {
          name: row.name,
          software: row.software,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bolna API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      call_id: data.call_id || data.id || 'unknown',
      status: data.status || 'initiated',
      message: data.message,
    };
  } catch (error) {
    return {
      call_id: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const text = await file.text();
    const rows = parseCSV(text);

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send total count
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'progress',
              current: 0,
              total: rows.length,
            }) + '\n'
          )
        );

        // Process each row
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];

          try {
            // Make Bolna API call
            const bolnaResponse = await initiateCallWithBolna(row);

            const result: CSVProcessingResult = {
              row,
              bolna_response: bolnaResponse,
              success: bolnaResponse.status !== 'failed',
              error: bolnaResponse.error,
            };

            // Send result
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'result',
                  data: result,
                }) + '\n'
              )
            );

            // Send progress update
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'progress',
                  current: i + 1,
                  total: rows.length,
                }) + '\n'
              )
            );

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            // Send error for this row
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'result',
                  data: {
                    row,
                    bolna_response: {
                      call_id: '',
                      status: 'failed',
                      error: error instanceof Error ? error.message : 'Unknown error',
                    },
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  },
                }) + '\n'
              )
            );
          }
        }

        // Send completion event
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'complete',
            }) + '\n'
          )
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    );
  }
}

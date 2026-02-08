import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // email, call_script, outreach_sequence

    const supabase = createClient();

    let query = supabase
      .from('templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('usage_count', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      templates: data || [],
    });
  } catch (error) {
    console.error('[Templates API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, description, subject, body: templateBody, variables } = body;

    if (!type || !name || !templateBody) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, name, body'
      }, { status: 400 });
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('templates')
      .insert({
        type,
        name,
        description,
        subject,
        body: templateBody,
        variables: variables || [],
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template: data,
    });
  } catch (error) {
    console.error('[Templates API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

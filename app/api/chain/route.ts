import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConversationContext, formatContextForWebhook } from '@/lib/context-memory';
import { STAGES } from '@/lib/types';

export const maxDuration = 150;

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate input
    const body = await request.json();
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (prompt.length > 5000) {
      return NextResponse.json({ error: 'Prompt too long (max 5000 characters)' }, { status: 400 });
    }

    // 3. Load user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('webhook_url, context_mode, context_count')
      .eq('id', user.id)
      .single();

    const webhookUrl = profile?.webhook_url?.trim() || process.env.N8N_WEBHOOK_URL;
    const contextMode = profile?.context_mode || 'recent';
    const contextCount = profile?.context_count ?? 3;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'No webhook URL configured' }, { status: 400 });
    }

    // 4. Retrieve context memory
    const contexts = await getConversationContext(
      supabase,
      user.id,
      prompt,
      contextMode as 'recent' | 'similarity' | 'off',
      contextCount
    );

    const contextString = formatContextForWebhook(contexts);

    // 5. Call n8n webhook
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 140000);

    let n8nResponse;
    try {
      n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: contextString || undefined,
        }),
        signal: controller.signal,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
      }
      return NextResponse.json({ error: 'Failed to connect to webhook' }, { status: 502 });
    }

    clearTimeout(timeoutId);

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: `Webhook returned status ${n8nResponse.status}` },
        { status: 502 }
      );
    }

    // 6. Parse response
    let data = await n8nResponse.json();

    // Normalize: n8n may wrap in array
    if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid response from webhook' }, { status: 502 });
    }

    const results = {
      strategist: data.strategist || '',
      analyst: data.analyst || '',
      copywriter: data.copywriter || '',
      skeptic: data.skeptic || '',
      operator: data.operator || '',
    };

    // 7. Save conversation to Supabase
    const title = prompt.length > 80 ? prompt.slice(0, 77) + '...' : prompt;

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, prompt, title })
      .select('id')
      .single();

    if (conversation && !convError) {
      // Save stage outputs
      const stageRows = STAGES.map((stage, index) => ({
        conversation_id: conversation.id,
        stage,
        content: results[stage],
        stage_order: index + 1,
      }));

      await supabase.from('stage_outputs').insert(stageRows);
    }

    // 8. Return results
    return NextResponse.json({
      conversationId: conversation?.id || null,
      results,
    });
  } catch (error) {
    console.error('Chain API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

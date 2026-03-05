import { SupabaseClient } from '@supabase/supabase-js';

interface ConversationContext {
  id: string;
  prompt: string;
  operatorSummary: string;
  createdAt: string;
}

export async function getConversationContext(
  supabase: SupabaseClient,
  userId: string,
  currentPrompt: string,
  mode: 'recent' | 'similarity' | 'off',
  count: number
): Promise<ConversationContext[]> {
  if (mode === 'off' || count === 0) return [];

  if (mode === 'similarity') {
    return getSimilarConversations(supabase, userId, currentPrompt, count);
  }

  return getRecentConversations(supabase, userId, count);
}

async function getRecentConversations(
  supabase: SupabaseClient,
  userId: string,
  count: number
): Promise<ConversationContext[]> {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, prompt, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(count);

  if (error || !conversations?.length) return [];

  return fetchOperatorSummaries(supabase, conversations);
}

async function getSimilarConversations(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  count: number
): Promise<ConversationContext[]> {
  const { data: results, error } = await supabase.rpc('search_similar_conversations', {
    p_user_id: userId,
    p_query: query,
    p_limit: count,
  });

  if (error || !results?.length) {
    // Fallback to recent if similarity search fails
    return getRecentConversations(supabase, userId, count);
  }

  return fetchOperatorSummaries(supabase, results);
}

async function fetchOperatorSummaries(
  supabase: SupabaseClient,
  conversations: Array<{ id: string; prompt: string; created_at: string }>
): Promise<ConversationContext[]> {
  const ids = conversations.map((c) => c.id);

  const { data: outputs, error } = await supabase
    .from('stage_outputs')
    .select('conversation_id, content')
    .in('conversation_id', ids)
    .eq('stage', 'operator');

  if (error) return [];

  const outputMap = new Map(
    (outputs || []).map((o) => [o.conversation_id, o.content])
  );

  return conversations
    .filter((c) => outputMap.has(c.id))
    .map((c) => ({
      id: c.id,
      prompt: c.prompt,
      operatorSummary: (outputMap.get(c.id) || '').slice(0, 1500),
      createdAt: c.created_at,
    }));
}

export function formatContextForWebhook(contexts: ConversationContext[]): string {
  if (!contexts.length) return '';

  const lines = contexts.map((c) => {
    const date = new Date(c.createdAt).toLocaleDateString();
    return `[${date}] Prompt: "${c.prompt.slice(0, 200)}"\nOperator Summary: "${c.operatorSummary}"`;
  });

  return `---CONTEXT FROM PAST CONVERSATIONS---\n\n${lines.join('\n\n')}\n\n---END CONTEXT---`;
}

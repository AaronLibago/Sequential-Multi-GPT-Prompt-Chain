import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ConversationDetail from '@/components/history/conversation-detail';

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!conversation) {
    notFound();
  }

  // Fetch stage outputs
  const { data: stages } = await supabase
    .from('stage_outputs')
    .select('stage, content')
    .eq('conversation_id', id)
    .order('stage_order', { ascending: true });

  const stageMap: Record<string, string> = {};
  (stages || []).forEach((s) => {
    stageMap[s.stage] = s.content;
  });

  const results = {
    strategist: stageMap.strategist || '',
    analyst: stageMap.analyst || '',
    copywriter: stageMap.copywriter || '',
    skeptic: stageMap.skeptic || '',
    operator: stageMap.operator || '',
  };

  return (
    <div>
      <Link
        href="/history"
        style={{
          display: 'inline-block',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: 'var(--color-primary)',
        }}
      >
        &larr; Back to History
      </Link>
      <ConversationDetail
        prompt={conversation.prompt}
        title={conversation.title}
        createdAt={conversation.created_at}
        results={results}
      />
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import ConversationList from '@/components/history/conversation-list';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, prompt, title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Conversation History
      </h2>
      <ConversationList conversations={conversations || []} />
    </div>
  );
}

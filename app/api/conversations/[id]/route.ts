import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Fetch conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
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

  return NextResponse.json({
    ...conversation,
    stages: {
      strategist: stageMap.strategist || '',
      analyst: stageMap.analyst || '',
      copywriter: stageMap.copywriter || '',
      skeptic: stageMap.skeptic || '',
      operator: stageMap.operator || '',
    },
  });
}

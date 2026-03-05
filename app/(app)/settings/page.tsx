import { createClient } from '@/lib/supabase/server';
import SettingsForm from '@/components/settings/settings-form';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('webhook_url, context_mode, context_count')
    .eq('id', user.id)
    .single();

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Settings</h2>
      <SettingsForm
        initialWebhookUrl={profile?.webhook_url || ''}
        initialContextMode={profile?.context_mode || 'recent'}
        initialContextCount={profile?.context_count ?? 3}
      />
    </div>
  );
}

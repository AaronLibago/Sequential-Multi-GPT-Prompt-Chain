import { createClient } from '@/lib/supabase/server';
import AppHeader from '@/components/layout/app-header';
import AppFooter from '@/components/layout/app-footer';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    displayName = profile?.display_name || user.email?.split('@')[0] || null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader displayName={displayName} />
      <main style={{ flex: 1, maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
        {children}
      </main>
      <AppFooter />
    </div>
  );
}

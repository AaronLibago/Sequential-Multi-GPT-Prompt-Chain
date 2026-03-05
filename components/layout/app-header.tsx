'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './app-header.module.css';

interface AppHeaderProps {
  displayName: string | null;
}

export default function AppHeader({ displayName }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/chain', label: 'Chain' },
    { href: '/history', label: 'History' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>Multi-GPT Chain</h1>
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className={styles.userSection}>
        <span className={styles.userName}>{displayName || 'User'}</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
}

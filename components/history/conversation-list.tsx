'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './conversation-list.module.css';

interface ConversationListItem {
  id: string;
  prompt: string;
  title: string | null;
  created_at: string;
}

interface ConversationListProps {
  conversations: ConversationListItem[];
}

export default function ConversationList({ conversations }: ConversationListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = conversations.filter((c) =>
    (c.title || c.prompt).toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Delete this conversation?')) return;

    setDeletingId(id);
    try {
      await fetch('/api/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search conversations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className={styles.empty}>
          {conversations.length === 0
            ? 'No conversations yet. Run a chain to get started!'
            : 'No conversations match your search.'}
        </p>
      ) : (
        <div className={styles.list}>
          {filtered.map((conv) => (
            <Link key={conv.id} href={`/history/${conv.id}`} className={styles.item}>
              <div className={styles.itemContent}>
                <p className={styles.itemTitle}>{conv.title || conv.prompt}</p>
                <p className={styles.itemDate}>
                  {new Date(conv.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(e, conv.id)}
                disabled={deletingId === conv.id}
                title="Delete conversation"
              >
                {deletingId === conv.id ? '...' : 'Delete'}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

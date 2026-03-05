'use client';

import { STAGE_CONFIGS } from '@/lib/types';
import type { ChainResults } from '@/lib/types';
import ResultCard from '@/components/chain/result-card';
import styles from './conversation-detail.module.css';

interface ConversationDetailProps {
  prompt: string;
  title: string | null;
  createdAt: string;
  results: ChainResults;
}

export default function ConversationDetail({
  prompt,
  title,
  createdAt,
  results,
}: ConversationDetailProps) {
  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>{title || prompt}</h2>
        <p className={styles.date}>
          {new Date(createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div className={styles.promptBox}>
        <p className={styles.promptLabel}>Prompt</p>
        <p className={styles.promptText}>{prompt}</p>
      </div>

      <div className={styles.results}>
        {STAGE_CONFIGS.map((config) => (
          <ResultCard
            key={config.name}
            config={config}
            content={results[config.name]}
            defaultExpanded={false}
          />
        ))}
      </div>
    </div>
  );
}

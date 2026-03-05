'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { StageName, StageConfig } from '@/lib/types';
import styles from './result-card.module.css';

interface ResultCardProps {
  config: StageConfig;
  content: string;
  defaultExpanded?: boolean;
}

export default function ResultCard({ config, content, defaultExpanded = true }: ResultCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={styles.resultCard}>
      <div
        className={styles.cardHeader}
        data-stage={config.name}
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <div className={styles.cardHeaderText}>
          <h3>Stage {config.order}: {config.label}</h3>
          <p className={styles.cardRole}>{config.role}</p>
        </div>
        <span className={`${styles.expandIcon} ${expanded ? styles.expandIconRotated : ''}`}>
          +
        </span>
      </div>
      <div className={`${styles.cardBody} ${expanded ? styles.cardBodyExpanded : ''}`}>
        <div className={styles.cardContent}>
          {content?.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          ) : (
            <p className={styles.noOutput}>(No output from this stage)</p>
          )}
        </div>
      </div>
    </div>
  );
}

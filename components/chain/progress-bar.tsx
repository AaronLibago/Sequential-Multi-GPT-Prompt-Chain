'use client';

import { useEffect, useState } from 'react';
import { STAGES, STAGE_CONFIGS, STAGE_CYCLE_MS } from '@/lib/types';
import styles from './progress-bar.module.css';

interface ProgressBarProps {
  isRunning: boolean;
}

export default function ProgressBar({ isRunning }: ProgressBarProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIndexes, setCompletedIndexes] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isRunning) {
      setActiveIndex(0);
      setCompletedIndexes(new Set());
      return;
    }

    let currentIndex = 0;
    setActiveIndex(0);
    setCompletedIndexes(new Set());

    const intervalId = setInterval(() => {
      setCompletedIndexes((prev) => new Set([...prev, currentIndex]));
      currentIndex++;

      if (currentIndex >= STAGES.length) {
        currentIndex = 0;
        setCompletedIndexes(new Set());
      }

      setActiveIndex(currentIndex);
    }, STAGE_CYCLE_MS);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  if (!isRunning) return null;

  const stage = STAGE_CONFIGS[activeIndex];

  return (
    <section className={styles.progressSection}>
      <h2 className={styles.progressTitle}>Processing</h2>
      <div className={styles.progressBar}>
        {STAGE_CONFIGS.map((config, index) => {
          const isActive = index === activeIndex;
          const isCompleted = completedIndexes.has(index);
          const classes = [
            styles.stageIndicator,
            isActive ? 'active' : '',
            isCompleted && !isActive ? 'completed' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={config.name} style={{ display: 'contents' }}>
              <div className={classes} data-stage={config.name}>
                <div className={styles.stageDot} />
                <span className={styles.stageLabel}>{config.label}</span>
              </div>
              {index < STAGE_CONFIGS.length - 1 && (
                <div
                  className={`${styles.stageConnector} ${completedIndexes.has(index) ? 'completed' : ''}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className={styles.progressText}>
        Stage {activeIndex + 1}: {stage.label} processing...
      </p>
    </section>
  );
}

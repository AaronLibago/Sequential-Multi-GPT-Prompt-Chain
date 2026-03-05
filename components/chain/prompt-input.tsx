'use client';

import styles from './prompt-input.module.css';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  hasResults: boolean;
  error: string | null;
}

export default function PromptInput({
  prompt,
  onPromptChange,
  onRun,
  onReset,
  isRunning,
  hasResults,
  error,
}: PromptInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onRun();
    }
  };

  return (
    <section className={styles.inputSection}>
      <label className={styles.label} htmlFor="master-prompt">
        Master Prompt
      </label>
      <textarea
        id="master-prompt"
        className={styles.textarea}
        rows={6}
        placeholder="Enter your master prompt here. Example: I want to launch a B2B SaaS product that helps small accounting firms automate their client onboarding process."
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isRunning}
      />
      <div className={styles.actions}>
        <button
          className={`${styles.btnPrimary} ${isRunning ? styles.btnPrimaryLoading : ''}`}
          onClick={onRun}
          disabled={isRunning || !prompt.trim()}
        >
          {isRunning ? 'Processing...' : 'Run Chain'}
        </button>
        <button
          className={styles.btnSecondary}
          onClick={onReset}
          disabled={isRunning || (!hasResults && !prompt.trim())}
        >
          Reset
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}

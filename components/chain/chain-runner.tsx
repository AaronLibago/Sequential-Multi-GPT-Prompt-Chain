'use client';

import { useReducer, useCallback } from 'react';
import { STAGE_CONFIGS, CARD_REVEAL_DELAY_MS } from '@/lib/types';
import type { ChainResults, ChainResponse } from '@/lib/types';
import { formatError, delay } from '@/lib/utils';
import PromptInput from './prompt-input';
import ProgressBar from './progress-bar';
import ResultCard from './result-card';
import styles from './chain-runner.module.css';

interface ChainState {
  status: 'idle' | 'running' | 'success' | 'error';
  prompt: string;
  results: ChainResults | null;
  conversationId: string | null;
  error: string | null;
  visibleCards: number;
}

type ChainAction =
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'START_RUN' }
  | { type: 'RUN_SUCCESS'; payload: { results: ChainResults; conversationId: string } }
  | { type: 'RUN_ERROR'; payload: string }
  | { type: 'SHOW_CARD' }
  | { type: 'RESET' };

function reducer(state: ChainState, action: ChainAction): ChainState {
  switch (action.type) {
    case 'SET_PROMPT':
      return { ...state, prompt: action.payload };
    case 'START_RUN':
      return { ...state, status: 'running', error: null, results: null, conversationId: null, visibleCards: 0 };
    case 'RUN_SUCCESS':
      return { ...state, status: 'success', results: action.payload.results, conversationId: action.payload.conversationId };
    case 'RUN_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'SHOW_CARD':
      return { ...state, visibleCards: state.visibleCards + 1 };
    case 'RESET':
      return { status: 'idle', prompt: '', results: null, conversationId: null, error: null, visibleCards: 0 };
    default:
      return state;
  }
}

const initialState: ChainState = {
  status: 'idle',
  prompt: '',
  results: null,
  conversationId: null,
  error: null,
  visibleCards: 0,
};

export default function ChainRunner() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleRun = useCallback(async () => {
    const prompt = state.prompt.trim();
    if (!prompt) return;

    dispatch({ type: 'START_RUN' });

    try {
      const response = await fetch('/api/chain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server returned status ${response.status}`);
      }

      const data: ChainResponse = await response.json();
      dispatch({ type: 'RUN_SUCCESS', payload: data });

      // Sequential card reveal
      for (let i = 0; i < STAGE_CONFIGS.length; i++) {
        dispatch({ type: 'SHOW_CARD' });
        if (i < STAGE_CONFIGS.length - 1) {
          await delay(CARD_REVEAL_DELAY_MS);
        }
      }
    } catch (error) {
      dispatch({ type: 'RUN_ERROR', payload: formatError(error) });
    }
  }, [state.prompt]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Sequential Multi-GPT Prompt Chain</h2>
        <p className={styles.pageSubtitle}>
          5-stage AI expert chain: Strategist &rarr; Analyst &rarr; Copywriter &rarr; Skeptic &rarr; Operator
        </p>
      </div>

      <PromptInput
        prompt={state.prompt}
        onPromptChange={(v) => dispatch({ type: 'SET_PROMPT', payload: v })}
        onRun={handleRun}
        onReset={handleReset}
        isRunning={state.status === 'running'}
        hasResults={!!state.results}
        error={state.error}
      />

      <ProgressBar isRunning={state.status === 'running'} />

      {state.results && (
        <section className={styles.resultsSection}>
          <h2 className={styles.resultsTitle}>Results</h2>
          {STAGE_CONFIGS.map((config, index) => {
            if (index >= state.visibleCards) return null;
            return (
              <ResultCard
                key={config.name}
                config={config}
                content={state.results![config.name]}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './settings-form.module.css';

interface SettingsFormProps {
  initialWebhookUrl: string;
  initialContextMode: string;
  initialContextCount: number;
}

export default function SettingsForm({
  initialWebhookUrl,
  initialContextMode,
  initialContextCount,
}: SettingsFormProps) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [contextMode, setContextMode] = useState(initialContextMode);
  const [contextCount, setContextCount] = useState(initialContextCount);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: 'error', text: 'Not authenticated' });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        webhook_url: webhookUrl,
        context_mode: contextMode,
        context_count: contextCount,
      })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Settings saved!' });
    }

    setSaving(false);
  };

  return (
    <div className={styles.form}>
      <div className={styles.section}>
        <label className={styles.label} htmlFor="webhook-url">Webhook URL</label>
        <p className={styles.description}>
          Your n8n webhook URL. Leave empty to use the default server URL.
        </p>
        <input
          id="webhook-url"
          className={styles.input}
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-n8n-app.fly.dev/webhook/multi-gpt-chain"
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label} htmlFor="context-mode">Context Memory Mode</label>
        <p className={styles.description}>
          Controls how past conversations are used to inform new chain runs.
        </p>
        <select
          id="context-mode"
          className={styles.select}
          value={contextMode}
          onChange={(e) => setContextMode(e.target.value)}
        >
          <option value="recent">Recent - Use last N conversations</option>
          <option value="similarity">Similarity - Find most relevant past conversations</option>
          <option value="off">Off - No context memory</option>
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Context Count: {contextCount}</label>
        <p className={styles.description}>
          Number of past conversations to include as context (0-10).
        </p>
        <div className={styles.rangeGroup}>
          <input
            className={styles.range}
            type="range"
            min={0}
            max={10}
            value={contextCount}
            onChange={(e) => setContextCount(parseInt(e.target.value, 10))}
          />
          <span className={styles.rangeValue}>{contextCount}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {message && (
          <span className={message.type === 'success' ? styles.successMsg : styles.errorMsg}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}

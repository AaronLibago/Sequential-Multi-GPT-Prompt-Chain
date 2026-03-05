export const STAGES = ['strategist', 'analyst', 'copywriter', 'skeptic', 'operator'] as const;
export type StageName = typeof STAGES[number];

export interface StageConfig {
  name: StageName;
  label: string;
  role: string;
  color: string;
  order: number;
}

export const STAGE_CONFIGS: StageConfig[] = [
  { name: 'strategist', label: 'Strategist', role: 'Strategic framework and goal definition', color: 'var(--color-strategist)', order: 1 },
  { name: 'analyst', label: 'Analyst', role: 'Logic check, gap analysis, strengthened reasoning', color: 'var(--color-analyst)', order: 2 },
  { name: 'copywriter', label: 'Copywriter', role: 'Messaging, positioning, communication clarity', color: 'var(--color-copywriter)', order: 3 },
  { name: 'skeptic', label: 'Skeptic', role: 'Risk assessment, blind spots, failure scenarios', color: 'var(--color-skeptic)', order: 4 },
  { name: 'operator', label: 'Operator', role: 'Final action plan and execution roadmap', color: 'var(--color-operator)', order: 5 },
];

export interface ChainResults {
  strategist: string;
  analyst: string;
  copywriter: string;
  skeptic: string;
  operator: string;
}

export interface ChainResponse {
  conversationId: string;
  results: ChainResults;
}

export interface Conversation {
  id: string;
  user_id: string;
  prompt: string;
  title: string | null;
  created_at: string;
}

export interface StageOutput {
  id: string;
  conversation_id: string;
  stage: StageName;
  content: string;
  stage_order: number;
  created_at: string;
}

export interface ConversationWithStages extends Conversation {
  stages: ChainResults;
}

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  webhook_url: string;
  context_mode: 'recent' | 'similarity' | 'off';
  context_count: number;
}

export const STAGE_CYCLE_MS = 5000;
export const CARD_REVEAL_DELAY_MS = 700;
export const REQUEST_TIMEOUT_MS = 150000;

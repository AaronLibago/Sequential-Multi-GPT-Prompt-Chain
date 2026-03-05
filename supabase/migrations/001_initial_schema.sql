-- ============================================================
-- Sequential Multi-GPT Prompt Chain - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable trigram extension for text similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- TABLE: profiles
-- Extends Supabase auth.users with app-specific data
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  display_name  TEXT,
  avatar_url    TEXT,
  webhook_url   TEXT DEFAULT '',
  context_mode  TEXT DEFAULT 'recent' CHECK (context_mode IN ('recent', 'similarity', 'off')),
  context_count INTEGER DEFAULT 3 CHECK (context_count BETWEEN 0 AND 10),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: conversations
-- One row per chain run
-- ============================================================
CREATE TABLE public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt      TEXT NOT NULL,
  title       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_user_created
  ON public.conversations (user_id, created_at DESC);

CREATE INDEX idx_conversations_prompt_trgm
  ON public.conversations USING GIN (prompt gin_trgm_ops);

-- ============================================================
-- TABLE: stage_outputs
-- 5 rows per conversation (one per stage)
-- ============================================================
CREATE TABLE public.stage_outputs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  stage           TEXT NOT NULL CHECK (stage IN ('strategist', 'analyst', 'copywriter', 'skeptic', 'operator')),
  content         TEXT NOT NULL,
  stage_order     INTEGER NOT NULL CHECK (stage_order BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (conversation_id, stage)
);

CREATE INDEX idx_stage_outputs_conversation
  ON public.stage_outputs (conversation_id, stage_order);

-- ============================================================
-- FUNCTION + TRIGGER: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: Similarity search for context memory
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_similar_conversations(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 3,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  prompt TEXT,
  title TEXT,
  similarity REAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.prompt,
    c.title,
    similarity(c.prompt, p_query) AS similarity,
    c.created_at
  FROM public.conversations c
  WHERE c.user_id = p_user_id
    AND (p_exclude_id IS NULL OR c.id != p_exclude_id)
    AND similarity(c.prompt, p_query) > 0.05
  ORDER BY similarity(c.prompt, p_query) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_outputs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Conversations: users can only CRUD their own conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Stage outputs: users can view/insert outputs for their own conversations
CREATE POLICY "Users can view own stage outputs"
  ON public.stage_outputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = stage_outputs.conversation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own stage outputs"
  ON public.stage_outputs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = stage_outputs.conversation_id
        AND c.user_id = auth.uid()
    )
  );

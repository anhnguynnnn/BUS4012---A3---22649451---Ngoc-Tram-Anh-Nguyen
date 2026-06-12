-- Phase 5 Database Foundation Migration
-- Date: 2026-06-12
-- Description: Extend profiles, posts, albums tables and create post_interactions table

-- ============================================================
-- 1. PROFILES — Add preference columns
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS style_attraction text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS size_range text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS height_range text,
  ADD COLUMN IF NOT EXISTS fit_preferences text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS styling_direction text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 2. POSTS — Add metadata columns for recommendation engine
-- ============================================================
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS style_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fit_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender_style text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS occasion_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS size_range text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS height_range text,
  ADD COLUMN IF NOT EXISTS body_friendly_label text,
  ADD COLUMN IF NOT EXISTS match_label_primary text,
  ADD COLUMN IF NOT EXISTS match_label_secondary text,
  ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS save_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count int DEFAULT 0;

-- ============================================================
-- 3. ALBUMS — Add public/private support and engagement count
-- ============================================================
ALTER TABLE public.albums
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS save_count int DEFAULT 0;

-- ============================================================
-- 4. POST_INTERACTIONS — Create behaviour tracking table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  interaction_score int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_posts_style_tags ON public.posts USING GIN (style_tags);
CREATE INDEX IF NOT EXISTS idx_posts_fit_tags ON public.posts USING GIN (fit_tags);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user ON public.post_interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_post ON public.post_interactions (post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_type ON public.post_interactions (interaction_type);
CREATE INDEX IF NOT EXISTS idx_post_interactions_created ON public.post_interactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_is_public ON public.albums (is_public) WHERE is_public = true;

-- ============================================================
-- 6. RLS POLICIES — post_interactions
-- ============================================================
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own interactions
CREATE POLICY "Users can insert own interactions"
  ON public.post_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own interactions
CREATE POLICY "Users can read own interactions"
  ON public.post_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own interactions
CREATE POLICY "Users can delete own interactions"
  ON public.post_interactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. RLS POLICIES — Fix album_posts (currently no RLS)
-- ============================================================
ALTER TABLE public.album_posts ENABLE ROW LEVEL SECURITY;

-- Users can manage posts in their own albums
CREATE POLICY "Users can insert into own albums"
  ON public.album_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = album_posts.album_id
      AND albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own album posts"
  ON public.album_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = album_posts.album_id
      AND (albums.user_id = auth.uid() OR albums.is_public = true)
    )
  );

CREATE POLICY "Users can delete from own albums"
  ON public.album_posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = album_posts.album_id
      AND albums.user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. RLS POLICIES — Public album visibility
-- ============================================================
CREATE POLICY "Anyone can read public albums"
  ON public.albums
  FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());
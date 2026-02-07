-- Add approved column to community_posts
ALTER TABLE public.community_posts ADD COLUMN approved boolean NOT NULL DEFAULT false;
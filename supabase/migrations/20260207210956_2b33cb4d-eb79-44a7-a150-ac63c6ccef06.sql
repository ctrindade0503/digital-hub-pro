
-- Add approved column to community_post_comments
ALTER TABLE public.community_post_comments 
ADD COLUMN approved boolean NOT NULL DEFAULT true;

-- Insert app_setting for requiring comment approval
INSERT INTO public.app_settings (key, value) 
VALUES ('require_comment_approval', 'false')
ON CONFLICT DO NOTHING;

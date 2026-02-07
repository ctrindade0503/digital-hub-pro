
ALTER TABLE public.feed_posts ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Update existing posts to link to the first admin user
UPDATE public.feed_posts 
SET user_id = (
  SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1
)
WHERE user_id IS NULL;

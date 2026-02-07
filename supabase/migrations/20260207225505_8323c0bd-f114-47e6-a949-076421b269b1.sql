
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender_id uuid,
  type text NOT NULL DEFAULT 'manual',
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Admin can manage all notifications
CREATE POLICY "Admin can manage notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast queries
CREATE INDEX idx_notifications_user_read ON public.notifications (user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications (created_at DESC);

-- Function to create notification for all users
CREATE OR REPLACE FUNCTION public.notify_all_users(
  _title text,
  _message text,
  _link text DEFAULT NULL,
  _type text DEFAULT 'manual',
  _sender_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, sender_id, type, title, message, link)
  SELECT ur.user_id, _sender_id, _type, _title, _message, _link
  FROM public.user_roles ur
  WHERE ur.role = 'user';
END;
$$;

-- Trigger: notify user when comment is approved
CREATE OR REPLACE FUNCTION public.notify_comment_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approved = true AND OLD.approved = false THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'system',
      'Comentário aprovado',
      'Seu comentário foi aprovado pela moderação.',
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_approved
AFTER UPDATE ON public.community_post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_comment_approved();

-- Trigger: notify user when their post gets a like
CREATE OR REPLACE FUNCTION public.notify_post_liked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _post_user_id uuid;
  _liker_name text;
BEGIN
  SELECT user_id INTO _post_user_id FROM public.community_posts WHERE id = NEW.post_id;
  
  -- Don't notify if liking own post
  IF _post_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  SELECT COALESCE(name, email, 'Alguém') INTO _liker_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    _post_user_id,
    'system',
    'Nova curtida',
    _liker_name || ' curtiu seu post na comunidade.'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_liked
AFTER INSERT ON public.community_post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_liked();

-- Trigger: notify all users when admin creates a feed post
CREATE OR REPLACE FUNCTION public.notify_new_feed_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_all_users(
    'Novo post no Feed',
    LEFT(NEW.content, 100),
    NULL,
    'system',
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_feed_post
AFTER INSERT ON public.feed_posts
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_feed_post();

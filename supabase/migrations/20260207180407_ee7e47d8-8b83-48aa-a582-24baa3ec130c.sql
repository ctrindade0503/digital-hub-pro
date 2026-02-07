
-- Add new fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS nickname text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS show_nickname boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_comments boolean NOT NULL DEFAULT true;

-- User preferences table
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  language text NOT NULL DEFAULT 'pt-BR',
  theme text NOT NULL DEFAULT 'light',
  notifications_enabled boolean NOT NULL DEFAULT true,
  email_notifications boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admin can manage preferences"
ON public.user_preferences FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Access history table
CREATE TABLE public.access_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  content_title text,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
ON public.access_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own history"
ON public.access_history FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage history"
ON public.access_history FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

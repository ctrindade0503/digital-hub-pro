
-- Drop restrictive SELECT policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view settings" ON public.app_settings;
CREATE POLICY "Anyone can view settings"
  ON public.app_settings
  FOR SELECT
  USING (true);

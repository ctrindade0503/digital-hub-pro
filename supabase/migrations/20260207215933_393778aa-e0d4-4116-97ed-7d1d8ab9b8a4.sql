-- Allow all authenticated users to see admin roles (needed for admin badge display)
CREATE POLICY "Anyone can view admin roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role = 'admin'::app_role);
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can manage comments" ON public.community_post_comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_post_comments;
DROP POLICY IF EXISTS "Users can comment" ON public.community_post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_post_comments;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admin can manage comments"
ON public.community_post_comments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view comments"
ON public.community_post_comments
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can comment"
ON public.community_post_comments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.community_post_comments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
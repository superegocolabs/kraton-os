
-- Create a security definer function to search profiles by email
-- This allows users to find other registered users for board sharing
CREATE OR REPLACE FUNCTION public.search_profiles_by_email(_email text)
RETURNS TABLE(id uuid, full_name text, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email
  FROM public.profiles p
  WHERE p.email ILIKE '%' || _email || '%'
  LIMIT 5;
$$;

-- Also allow authenticated users to read limited profile info for board members
CREATE POLICY "Users can view profiles of board co-members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm1
      JOIN board_members bm2 ON bm1.board_id = bm2.board_id
      WHERE bm1.user_id = auth.uid() AND bm2.user_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM boards b
      JOIN board_members bm ON bm.board_id = b.id
      WHERE b.user_id = auth.uid() AND bm.user_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM boards b
      JOIN board_members bm ON bm.board_id = b.id
      WHERE b.user_id = profiles.id AND bm.user_id = auth.uid()
    )
  );

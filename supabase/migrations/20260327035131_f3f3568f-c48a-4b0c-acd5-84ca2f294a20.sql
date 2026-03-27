-- Fix overly permissive insert policy on user_notifications
DROP POLICY "Authenticated users can create notifications" ON public.user_notifications;

-- Only allow inserting notifications for board invitation flows (invited_by = self)
CREATE POLICY "Users can create notifications for invites"
  ON public.user_notifications FOR INSERT TO authenticated
  WITH CHECK (
    -- Allow inserting notifications where the metadata references a board the user owns
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.user_id = auth.uid()
      AND boards.id::text = (user_notifications.metadata->>'board_id')
    )
    OR
    -- Allow inserting when updating own invitation (for accept/reject notification back to owner)
    EXISTS (
      SELECT 1 FROM board_invitations bi
      WHERE bi.invited_user_id = auth.uid()
      AND bi.id::text = (user_notifications.metadata->>'invitation_id')
    )
  );

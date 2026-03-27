-- Board invitations table for share/accept/reject flow
CREATE TABLE public.board_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  invited_by uuid NOT NULL,
  invited_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

ALTER TABLE public.board_invitations ENABLE ROW LEVEL SECURITY;

-- Board owner can manage invitations
CREATE POLICY "Board owners can manage invitations"
  ON public.board_invitations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM boards WHERE boards.id = board_invitations.board_id AND boards.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM boards WHERE boards.id = board_invitations.board_id AND boards.user_id = auth.uid()));

-- Invited users can view and update their own invitations
CREATE POLICY "Invited users can view own invitations"
  ON public.board_invitations FOR SELECT TO authenticated
  USING (invited_user_id = auth.uid());

CREATE POLICY "Invited users can respond to invitations"
  ON public.board_invitations FOR UPDATE TO authenticated
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- User notifications table
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.user_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.user_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert notifications (for invite flow)
CREATE POLICY "Authenticated users can create notifications"
  ON public.user_notifications FOR INSERT TO authenticated
  WITH CHECK (true);

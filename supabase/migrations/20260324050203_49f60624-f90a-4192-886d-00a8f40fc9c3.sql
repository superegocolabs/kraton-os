-- Add brand_color to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#C5A47E';

-- Create board_members table for team collaboration per board
CREATE TABLE public.board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);

ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board owners can manage members"
  ON public.board_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.boards WHERE boards.id = board_members.board_id AND boards.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.boards WHERE boards.id = board_members.board_id AND boards.user_id = auth.uid()));

CREATE POLICY "Members can view own membership"
  ON public.board_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Board members can view shared boards"
  ON public.boards FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.board_members WHERE board_members.board_id = boards.id AND board_members.user_id = auth.uid()));

CREATE POLICY "Board members can view lists on shared boards"
  ON public.board_lists FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.board_members bm
    WHERE bm.board_id = board_lists.board_id AND bm.user_id = auth.uid()
  ));

CREATE POLICY "Board members can manage cards on shared boards"
  ON public.board_cards FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.board_lists bl
    JOIN public.board_members bm ON bm.board_id = bl.board_id
    WHERE bl.id = board_cards.list_id AND bm.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.board_lists bl
    JOIN public.board_members bm ON bm.board_id = bl.board_id
    WHERE bl.id = board_cards.list_id AND bm.user_id = auth.uid()
  ));

CREATE POLICY "Board members can manage lists on shared boards"
  ON public.board_lists FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.board_members bm
    WHERE bm.board_id = board_lists.board_id AND bm.user_id = auth.uid() AND bm.role = 'editor'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.board_members bm
    WHERE bm.board_id = board_lists.board_id AND bm.user_id = auth.uid() AND bm.role = 'editor'
  ));
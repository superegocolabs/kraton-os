
-- Client feedback table for portal comments/approvals
CREATE TABLE public.client_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Client',
  message text NOT NULL,
  feedback_type text NOT NULL DEFAULT 'comment', -- comment, approval, revision
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

-- Anon can insert feedback on active portals
CREATE POLICY "Anon can insert feedback on active portals"
ON public.client_feedback FOR INSERT TO anon
WITH CHECK (
  EXISTS (SELECT 1 FROM public.client_portals WHERE id = portal_id AND is_active = true)
);

-- Anon can view feedback on active portals
CREATE POLICY "Anon can view feedback on active portals"
ON public.client_feedback FOR SELECT TO anon
USING (
  EXISTS (SELECT 1 FROM public.client_portals WHERE id = portal_id AND is_active = true)
);

-- Authenticated users can view feedback on their portals
CREATE POLICY "Users can view feedback on own portals"
ON public.client_feedback FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.client_portals WHERE id = portal_id AND user_id = auth.uid())
);

-- Authenticated users can delete feedback on their portals
CREATE POLICY "Users can delete feedback on own portals"
ON public.client_feedback FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.client_portals WHERE id = portal_id AND user_id = auth.uid())
);

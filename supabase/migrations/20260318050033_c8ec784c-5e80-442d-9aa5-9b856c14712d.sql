
-- Notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes" ON public.notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add portal_pin to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portal_pin text DEFAULT NULL;

-- Add access_code to client_portals
ALTER TABLE public.client_portals ADD COLUMN IF NOT EXISTS access_code text DEFAULT NULL;

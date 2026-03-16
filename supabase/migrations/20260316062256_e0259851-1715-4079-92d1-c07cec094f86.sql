
-- Client portals table
CREATE TABLE public.client_portals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  welcome_message TEXT DEFAULT 'Welcome to your project portal.',
  accent_color TEXT DEFAULT '#C5A47E',
  studio_name TEXT DEFAULT 'Creative Studio',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Owners can manage their portals"
  ON public.client_portals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read active portals (for client-facing view)
CREATE POLICY "Public can view active portals"
  ON public.client_portals FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated users can also read active portals  
CREATE POLICY "Authenticated can view active portals"
  ON public.client_portals FOR SELECT
  TO authenticated
  USING (is_active = true);

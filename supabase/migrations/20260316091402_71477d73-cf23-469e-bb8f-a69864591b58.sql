-- 1. Remove overly broad authenticated policy
DROP POLICY IF EXISTS "Authenticated can view active portals" ON public.client_portals;

-- 2. Create security definer function for portal-scoped access
CREATE OR REPLACE FUNCTION public.client_has_active_portal(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_portals
    WHERE client_id = _client_id AND is_active = true
  );
$$;

-- 3. Allow anon to read projects for clients with active portals
CREATE POLICY "Anon can view projects via portal"
ON public.projects FOR SELECT TO anon
USING (public.client_has_active_portal(client_id));

-- 4. Allow anon to read invoices for clients with active portals
CREATE POLICY "Anon can view invoices via portal"
ON public.invoices FOR SELECT TO anon
USING (public.client_has_active_portal(client_id));

-- 5. Add foreign key constraints to client_portals
ALTER TABLE public.client_portals
  ADD CONSTRAINT fk_client_portals_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
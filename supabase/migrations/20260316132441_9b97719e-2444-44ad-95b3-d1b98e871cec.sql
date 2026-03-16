
-- Add hidden_from_portal column
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS hidden_from_portal boolean NOT NULL DEFAULT false;

-- Allow anon to update only payment_proof_url on invoices linked to active portals
CREATE POLICY "Anon can upload payment proof"
ON public.invoices
FOR UPDATE
TO anon
USING (client_has_active_portal(client_id))
WITH CHECK (client_has_active_portal(client_id));

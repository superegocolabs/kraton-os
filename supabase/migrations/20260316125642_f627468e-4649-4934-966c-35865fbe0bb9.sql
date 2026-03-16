
-- Storage bucket for payment proofs (bukti transfer)
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true);

-- Allow anon to upload payment proofs
CREATE POLICY "Anon can upload payment proofs"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow anyone to view payment proofs
CREATE POLICY "Public can view payment proofs"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to manage payment proofs
CREATE POLICY "Authenticated can manage payment proofs"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'payment-proofs')
WITH CHECK (bucket_id = 'payment-proofs');

-- Add payment_proof_url column to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_proof_url text DEFAULT NULL;

-- Add notes column for invoice items/details (already exists, we'll use it for line items JSON)
-- Add line_items column for structured invoice details
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS line_items jsonb DEFAULT '[]'::jsonb;

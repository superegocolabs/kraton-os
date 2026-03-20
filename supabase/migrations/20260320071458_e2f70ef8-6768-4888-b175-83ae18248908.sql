-- Membership settings (admin CMS for QRIS, pricing, etc.)
CREATE TABLE IF NOT EXISTS public.membership_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL DEFAULT 'Pro',
  price numeric NOT NULL DEFAULT 149000,
  price_label text DEFAULT 'Rp 149.000 / month',
  description text DEFAULT 'Full access to all features without limits.',
  qris_image_url text,
  features jsonb DEFAULT '["Unlimited Projects","Unlimited Clients","Unlimited Boards","Unlimited Notes","Slideshow Access","Priority Support"]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

CREATE POLICY "Anyone can view membership settings" ON public.membership_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage membership settings" ON public.membership_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.membership_settings (plan_name, price, price_label, description)
VALUES ('Pro', 149000, 'Rp 149.000 / month', 'Full access to all features without limits.');

-- App settings / feature flags
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE POLICY "Anyone can read app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.app_settings (key, value) VALUES ('feature_slideshow', '{"enabled": false, "label": "Slideshow", "description": "Presentation builder for client pitches"}'::jsonb);

-- Presentations / Slideshow
CREATE TABLE IF NOT EXISTS public.presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Presentation',
  template text NOT NULL DEFAULT 'minimal',
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE POLICY "Users can manage own presentations" ON public.presentations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Payment proof for membership upgrades
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS payment_proof_url text;
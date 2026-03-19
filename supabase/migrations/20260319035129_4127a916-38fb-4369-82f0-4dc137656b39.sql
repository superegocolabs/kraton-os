
-- Add brand personalization columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS brand_logo_url text;

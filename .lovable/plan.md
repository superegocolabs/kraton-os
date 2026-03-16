

## Security Review Findings

### Critical Issues

**1. Client Portal RLS — Data Leakage (HIGH)**
The `client_portals` table has an overly broad "Authenticated can view active portals" policy that lets **any** logged-in user see all other studios' portal data (studio names, client IDs, user IDs, slugs). The anon policy similarly exposes internal UUIDs to the public.

**Fix:** Remove the "Authenticated can view active portals" policy. The existing "Owners can manage their portals" policy already covers owner access. Keep the anon policy but it's acceptable since the portal is intentionally public — however, consider restricting columns returned in the public view query.

**2. Portal View Queries Bypass RLS by Design — but Leak Private Data (MEDIUM)**
`ClientPortalView.tsx` queries `projects` and `invoices` tables using a `client_id` obtained from the portal. Since projects/invoices have RLS scoped to `user_id = auth.uid()`, these queries will **fail silently for anon users** (return empty arrays). The portal feature is currently broken for unauthenticated visitors.

**Fix:** Add anon SELECT policies on `projects` and `invoices` that are scoped to rows where the `client_id` belongs to an active portal. This requires a security definer function to avoid leaking data.

**3. Leaked Password Protection Disabled (LOW)**
Supabase's built-in leaked password protection is off.

**Fix:** Enable it in Supabase Dashboard → Auth → Settings.

### Moderate Issues

**4. No Foreign Keys on `client_portals` (MEDIUM)**
`client_portals.client_id` and `client_portals.user_id` have no foreign key constraints, allowing orphaned records.

**Fix:** Add FK constraints via migration.

**5. Missing Input Validation (LOW-MEDIUM)**
Forms lack robust validation — e.g., invoice `amount` accepts negative values (only `min="0"` on HTML, no server-side check), no sanitization on `notes`/`description` fields that could be rendered in portals.

**Fix:** Add Zod validation on form submissions; sanitize text rendered in the public portal view.

### Implementation Plan

**Step 1 — Fix RLS policies (migration)**
```sql
-- Remove the overly broad authenticated policy
DROP POLICY "Authenticated can view active portals" ON public.client_portals;

-- Create helper function for portal-scoped access
CREATE OR REPLACE FUNCTION public.client_has_active_portal(_client_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_portals
    WHERE client_id = _client_id AND is_active = true
  );
$$;

-- Allow anon to read projects for clients with active portals
CREATE POLICY "Anon can view projects via portal"
ON public.projects FOR SELECT TO anon
USING (public.client_has_active_portal(client_id));

-- Allow anon to read invoices for clients with active portals
CREATE POLICY "Anon can view invoices via portal"
ON public.invoices FOR SELECT TO anon
USING (public.client_has_active_portal(client_id));

-- Add foreign keys to client_portals
ALTER TABLE public.client_portals
  ADD CONSTRAINT fk_client_portals_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_client_portals_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
```

**Step 2 — Harden input validation**
- Add basic length/value checks to `AddInvoiceDialog` (ensure amount > 0) and `AddProjectDialog` (budget >= 0).
- Sanitize portal `welcome_message` output in `ClientPortalView.tsx` to prevent XSS if HTML were ever injected.

**Step 3 — User action required**
- Enable **Leaked Password Protection** in Supabase Dashboard → Auth → Settings.


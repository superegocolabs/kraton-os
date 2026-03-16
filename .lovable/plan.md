

## Plan: Invoice Sync & Portal Upload Improvements

### Issues Identified

1. **Client upload has no "Send" button** — file uploads silently without confirmation, and the `payment_proof_url` is never saved to the invoice (anon can't UPDATE invoices).
2. **Admin can't see payment proofs** — `InvoiceList` doesn't show proof links.
3. **No "hide from client" toggle** — admin can't hide specific invoices from portal view.
4. **Draft invoices can't be edited** — no edit functionality exists.

### Implementation

**Step 1 — Database migration**
- Add `hidden_from_portal` boolean column (default `false`) to `invoices` table.
- Add anon UPDATE policy on `invoices` scoped to only `payment_proof_url` column, restricted to invoices where `client_has_active_portal(client_id)` is true. This lets the portal save the proof URL.

**Step 2 — Client Portal (`ClientPortalView.tsx`)**
- After file is selected, show a confirmation UI with file name + "Kirim" (Send) button instead of auto-uploading.
- On "Kirim", upload to storage, then UPDATE the invoice's `payment_proof_url` via supabase.
- Filter out invoices where `hidden_from_portal = true` in the query.

**Step 3 — Admin Finance: View proof & hide invoice (`InvoiceList.tsx`)**
- Add a button to view payment proof (opens image/PDF in new tab) when `payment_proof_url` exists.
- Add an eye/eye-off toggle button to set `hidden_from_portal` on each invoice.
- Show a visual indicator when an invoice is hidden from portal.

**Step 4 — Edit draft invoices (`AddInvoiceDialog.tsx` + `FinancePage.tsx`)**
- Convert `AddInvoiceDialog` to support edit mode: accept optional `initialValues` prop.
- Add an edit button on draft invoices in `InvoiceList`.
- In `FinancePage`, wire up an `updateInvoice` mutation and pass selected invoice data to dialog.


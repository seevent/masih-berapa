-- ====================================================================
-- MIGRASI: Amankan view current_stock
-- Tanggal : 2026-10-02 (sudah diterapkan di Supabase sebagai
--           "current_stock_security_invoker")
--
-- Sebelumnya view berjalan dengan hak pembuatnya (SECURITY DEFINER, ditandai ERROR oleh
-- Supabase security advisor `security_definer_view`) dan role anon/authenticated
-- memiliki hak INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER pada view.
--
-- Sekarang view dibaca dengan hak & RLS pembacanya, dan hanya boleh di-SELECT.
-- ====================================================================

ALTER VIEW public.current_stock SET (security_invoker = true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.current_stock FROM anon, authenticated;
GRANT SELECT ON public.current_stock TO anon, authenticated;

-- ROLLBACK:
-- ALTER VIEW public.current_stock RESET (security_invoker);

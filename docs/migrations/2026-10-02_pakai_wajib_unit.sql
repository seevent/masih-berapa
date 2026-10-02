-- ====================================================================
-- MIGRASI: Transaksi Pakai wajib mencatat unit peralatan (keputusan K1,
--          docs/specs/predictive-maintenance.md, tiket T8)
-- Tanggal : 2026-10-02
-- Status  : SUDAH DITERAPKAN di Supabase pada 2026-10-02 sebagai "pakai_wajib_unit"
--           (versi 20261002152932) atas persetujuan pemilik
--
-- Aplikasi sudah menolak Pakai tanpa unit (InventoryContext). Migrasi ini membuat
-- aturan yang sama berlaku bagi semua penulis ke stock_mutations.
--
-- Mengapa trigger, bukan CHECK (mutation_type <> 'Pakai' OR unit_id IS NOT NULL):
-- FK stock_mutations.unit_id memakai ON DELETE SET NULL. Dengan CHECK, menghapus unit
-- yang punya riwayat Pakai akan GAGAL karena SET NULL melanggar CHECK (sudah dibuktikan
-- dalam transaksi yang dibatalkan). Trigger di bawah hanya memeriksa penulisan langsung
-- (pg_trigger_depth() = 1); SET NULL dari penghapusan unit tetap berjalan, dan mutasi
-- itu tetap tercatat dengan unit_id NULL (diabaikan oleh perhitungan MTBF).
--
-- Hasil uji (2026-10-02, DO-block yang dibatalkan, sebagai anon):
--   Pakai tanpa unit ditolak (23514) · Pakai dengan unit diterima ·
--   UPDATE unit_id -> NULL pada Pakai ditolak · ubah Masuk -> Pakai tanpa unit ditolak ·
--   ubah catatan diterima · hapus unit berhasil, unit_id mutasi menjadi NULL.
--   Setelah uji: 0 mutasi, 135 unit, tanpa trigger/fungsi tersisa.
-- Data saat ini: 0 transaksi, jadi tidak ada baris lama yang melanggar.
--
-- Verifikasi setelah diterapkan (database sebenarnya, sebagai anon, transaksi dibatalkan):
--   Pakai tanpa unit ditolak (pesan: "Transaksi Pakai wajib mencatat unit_id ...") ·
--   Pakai dengan unit diterima · mengosongkan unit pada Pakai ditolak ·
--   ubah Masuk -> Pakai tanpa unit ditolak · ubah catatan diterima · Bekas tanpa unit diterima.
--   Setelah itu 0 mutasi dan 135 unit (tidak berubah).
--   Catatan: penghapusan unit tidak diuji ulang setelah diterapkan karena alat uji menggantung pada
--   perintah DELETE; perilakunya sudah terbukti pada uji sebelum diterapkan (definisi identik).
-- ====================================================================

CREATE OR REPLACE FUNCTION public.stock_mutations_pakai_wajib_unit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- depth 1 = INSERT/UPDATE langsung; depth > 1 = aksi FK (ON DELETE SET NULL) dsb.
  IF NEW.mutation_type = 'Pakai' AND NEW.unit_id IS NULL AND pg_trigger_depth() = 1 THEN
    RAISE EXCEPTION 'Transaksi Pakai wajib mencatat unit_id (unit peralatan tempat sparepart dipasang)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER stock_mutations_pakai_wajib_unit
  BEFORE INSERT OR UPDATE OF mutation_type, unit_id ON public.stock_mutations
  FOR EACH ROW EXECUTE FUNCTION public.stock_mutations_pakai_wajib_unit();

-- ROLLBACK:
-- DROP TRIGGER IF EXISTS stock_mutations_pakai_wajib_unit ON public.stock_mutations;
-- DROP FUNCTION IF EXISTS public.stock_mutations_pakai_wajib_unit();

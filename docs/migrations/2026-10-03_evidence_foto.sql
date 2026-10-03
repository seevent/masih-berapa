-- ====================================================================
-- MIGRASI: Foto evidence pada transaksi (stock_mutations.evidence_urls)
-- Tanggal : 2026-10-03
-- Status  : BELUM DITERAPKAN. Terapkan hanya setelah pemilik menyetujui, dan SEBELUM kode
--           aplikasi yang menulis kolom ini di-deploy (INSERT dari kode baru mengirim
--           evidence_urls; tanpa migrasi, PostgREST menolaknya).
--
-- Tujuan: tiap transaksi menyimpan 1-5 foto evidence. Foto dikompres di browser lalu diunggah
-- ke Cloudinary (unsigned preset); database hanya menyimpan URL-nya.
--
-- Kolom baru (nullable; baris lama tetap NULL):
--   evidence_urls text[]   daftar URL https Cloudinary. Satu nota (banyak baris) menyimpan
--                          daftar yang sama pada setiap barisnya, sehingga tiap baris di
--                          Riwayat berdiri sendiri dan tetap punya foto bila baris lain dihapus.
-- CHECK: paling banyak 10 elemen (aplikasi membatasi 5; batas database hanya pagar pengaman
--        bagi penulis lain).
--
-- Yang TIDAK berubah: aturan stok, view current_stock, trigger stock_mutations_pakai_wajib_unit,
-- RLS/hak akses (policy "Public full access stock_mutations" berlaku untuk kolom baru).
-- Aplikasi lain yang membaca stock_mutations tidak terpengaruh (kolom nullable baru).
--
-- Catatan: file di Cloudinary tidak ikut terhapus saat transaksi dihapus/diubah (unggahan
-- unsigned tidak bisa menghapus). Foto yatim bisa dibersihkan dari konsol Cloudinary lewat tag
-- "masih-berapa".
-- ====================================================================

ALTER TABLE public.stock_mutations
  ADD COLUMN IF NOT EXISTS evidence_urls text[];

ALTER TABLE public.stock_mutations
  ADD CONSTRAINT stock_mutations_evidence_urls_check
  CHECK (evidence_urls IS NULL OR cardinality(evidence_urls) <= 10);

COMMENT ON COLUMN public.stock_mutations.evidence_urls IS
  'URL foto evidence (Cloudinary), maksimal 10; aplikasi memakai 1-5. Daftar yang sama pada setiap baris satu nota.';

-- ROLLBACK:
-- ALTER TABLE public.stock_mutations DROP CONSTRAINT IF EXISTS stock_mutations_evidence_urls_check;
-- ALTER TABLE public.stock_mutations DROP COLUMN IF EXISTS evidence_urls;

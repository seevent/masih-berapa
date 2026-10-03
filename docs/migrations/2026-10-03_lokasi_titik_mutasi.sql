-- ====================================================================
-- MIGRASI: Lokasi, titik, dan isian manual pada stock_mutations
-- Tanggal : 2026-10-03
-- Status  : BELUM DITERAPKAN. Terapkan hanya setelah pemilik menyetujui, dan
--           SEBELUM kode aplikasi yang menulis kolom ini di-deploy (INSERT dari kode baru
--           mengirim kolom-kolom di bawah; tanpa migrasi, PostgREST menolaknya).
--
-- Tujuan:
--   * Pakai        : simpan lokasi dan titik tempat unit dipasang (selain unit_id yang sudah ada).
--   * Masuk bekas/rusak : unit/lokasi/titik asal copotan boleh dipilih dari daftar ATAU ditulis
--                    manual (bila unit belum terdaftar atau data kompatibilitas belum lengkap).
--
-- Kolom baru (semua nullable; baris lama tidak berubah):
--   lokasi_id     uuid  FK lokasi(id)        ON DELETE SET NULL  lokasi yang dipilih dari daftar
--   titik_id      uuid  FK titik_lokasi(id)  ON DELETE SET NULL  titik yang dipilih dari daftar
--   lokasi_manual text                                           lokasi tulisan tangan
--   titik_manual  text                                           titik tulisan tangan
--   unit_manual   text                                           unit tulisan tangan (unit_id tetap NULL)
-- Aplikasi mengisi salah satu dari (lokasi_id | lokasi_manual), (titik_id | titik_manual),
-- (unit_id | unit_manual), tidak keduanya.
--
-- Yang TIDAK berubah:
--   * Aturan stok dan view current_stock (tidak ada kolom stok yang disentuh).
--   * Trigger stock_mutations_pakai_wajib_unit: Pakai tetap wajib unit_id (unit manual tidak berlaku
--     untuk Pakai, karena MTBF dihitung per unit_id).
--   * Kolom sumber: sudah varchar tanpa batas panjang dan tanpa CHECK, jadi sumber tulisan
--     tangan ditulis langsung ke kolom itu (tidak perlu kolom baru).
--   * RLS/hak akses: policy "Public full access stock_mutations" berlaku untuk seluruh baris/kolom.
--
-- Aplikasi lain yang membaca stock_mutations tidak terpengaruh: hanya menambah kolom nullable.
-- ====================================================================

ALTER TABLE public.stock_mutations
  ADD COLUMN IF NOT EXISTS lokasi_id     uuid REFERENCES public.lokasi(id)        ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS titik_id      uuid REFERENCES public.titik_lokasi(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lokasi_manual text,
  ADD COLUMN IF NOT EXISTS titik_manual  text,
  ADD COLUMN IF NOT EXISTS unit_manual   text;

COMMENT ON COLUMN public.stock_mutations.lokasi_id IS
  'Lokasi dari daftar: tempat unit dipasang (Pakai) atau asal copotan (Masuk bekas/rusak).';
COMMENT ON COLUMN public.stock_mutations.titik_id IS
  'Titik dari daftar, pasangan lokasi_id.';
COMMENT ON COLUMN public.stock_mutations.lokasi_manual IS
  'Lokasi tulisan tangan (Masuk bekas/rusak) bila tidak ada di daftar; lokasi_id NULL.';
COMMENT ON COLUMN public.stock_mutations.titik_manual IS
  'Titik tulisan tangan (Masuk bekas/rusak); titik_id NULL.';
COMMENT ON COLUMN public.stock_mutations.unit_manual IS
  'Unit tulisan tangan (Masuk bekas/rusak) bila unit belum terdaftar; unit_id NULL. Tidak berlaku untuk Pakai.';

-- ROLLBACK:
-- ALTER TABLE public.stock_mutations
--   DROP COLUMN IF EXISTS lokasi_id, DROP COLUMN IF EXISTS titik_id,
--   DROP COLUMN IF EXISTS lokasi_manual, DROP COLUMN IF EXISTS titik_manual,
--   DROP COLUMN IF EXISTS unit_manual;

-- ====================================================================
-- MIGRASI: Tiga tipe transaksi (Masuk, Pakai, Serah Terima) dengan kondisi per baris
-- Tanggal : 2026-10-02
-- Status  : SUDAH DITERAPKAN di Supabase pada 2026-10-02 sebagai "transaksi_tiga_tipe"
--           (versi 20261002185618) atas persetujuan pemilik
-- Verifikasi setelah diterapkan (database sebenarnya, sebagai anon, transaksi dibatalkan):
--   nota 5 baris (Masuk baru/bekas/rusak, Pakai bekas/baru) diterima · Pakai dari rusak ditolak ·
--   Pakai tanpa unit tetap ditolak (trigger pakai_wajib_unit) · nota dengan 1 baris salah ditolak
--   seluruhnya · current_stock = 1/1/1 (sama dengan src/utils/stock.ts). Setelah itu 0 mutasi.
--
-- Keputusan pemilik (2 Okt 2026):
--   * Masuk  : bisa memasukkan stok baru, bekas, ATAU rusak  -> stok_tujuan baru|bekas|rusak
--   * Pakai  : mengambil stok baru ATAU bekas                -> stok_asal  baru|bekas
--   * Transaksi Bekas dan Rusak dihapus dari aplikasi (tetap DIHITUNG bila ada baris lama /
--     dari aplikasi lain, jadi nilainya tetap diizinkan oleh constraint tipe).
--
-- Hanya constraint stock_mutations_aliran_stok_check yang berubah:
--   Masuk: dulu tujuan hanya 'baru'      -> sekarang tujuan baru|bekas|rusak (asal tetap NULL)
--   Pakai: dulu asal hanya 'baru'        -> sekarang asal baru|bekas (tujuan tetap NULL)
-- View current_stock TIDAK berubah: ia sudah memakai COALESCE(stok_asal/stok_tujuan, default tipe),
-- sehingga Masuk bekas/rusak dan Pakai dari bekas langsung terhitung benar.
-- Aman untuk data sekarang (0 transaksi) dan longgar terhadap baris lama (aturan hanya diperluas).
-- TERAPKAN SEBELUM kode "tiga tipe transaksi" dideploy (kode baru akan ditolak constraint lama).
-- ====================================================================

ALTER TABLE public.stock_mutations DROP CONSTRAINT IF EXISTS stock_mutations_aliran_stok_check;

ALTER TABLE public.stock_mutations
  ADD CONSTRAINT stock_mutations_aliran_stok_check CHECK (
    CASE mutation_type
      WHEN 'Masuk' THEN stok_asal IS NULL
      WHEN 'Pakai' THEN (stok_asal IS NULL OR stok_asal IN ('baru', 'bekas')) AND stok_tujuan IS NULL
      -- tipe lama, tidak lagi ditulis aplikasi ini
      WHEN 'Bekas' THEN stok_asal IS NULL AND (stok_tujuan IS NULL OR stok_tujuan = 'bekas')
      WHEN 'Rusak' THEN (stok_asal IS NULL OR stok_asal IN ('baru', 'bekas'))
                        AND (stok_tujuan IS NULL OR stok_tujuan = 'rusak')
      WHEN 'Serah Terima' THEN stok_asal IS NULL OR stok_tujuan IS NULL
      ELSE true
    END
  );

-- ROLLBACK (hanya bila belum ada baris Masuk bekas/rusak atau Pakai dari bekas):
-- ALTER TABLE public.stock_mutations DROP CONSTRAINT IF EXISTS stock_mutations_aliran_stok_check;
-- ALTER TABLE public.stock_mutations ADD CONSTRAINT stock_mutations_aliran_stok_check CHECK (
--   CASE mutation_type
--     WHEN 'Masuk' THEN stok_asal IS NULL AND (stok_tujuan IS NULL OR stok_tujuan = 'baru')
--     WHEN 'Pakai' THEN (stok_asal IS NULL OR stok_asal = 'baru') AND stok_tujuan IS NULL
--     WHEN 'Bekas' THEN stok_asal IS NULL AND (stok_tujuan IS NULL OR stok_tujuan = 'bekas')
--     WHEN 'Rusak' THEN (stok_asal IS NULL OR stok_asal IN ('baru', 'bekas'))
--                       AND (stok_tujuan IS NULL OR stok_tujuan = 'rusak')
--     WHEN 'Serah Terima' THEN stok_asal IS NULL OR stok_tujuan IS NULL
--     ELSE true
--   END);

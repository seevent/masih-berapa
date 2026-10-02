-- ====================================================================
-- MIGRASI: Aliran stok per transaksi (stok_asal -> stok_tujuan)
-- Tanggal : 2026-10-02
--
-- Setiap mutasi memindahkan qty dari satu "kantong" stok ke kantong lain.
-- Kantong: 'baru', 'bekas', 'rusak'. NULL = di luar gudang.
--
--   Tipe          stok_asal            stok_tujuan
--   Masuk         NULL                 baru
--   Pakai         baru                 NULL
--   Bekas         NULL                 bekas
--   Rusak         baru | bekas         rusak
--   Serah Terima  NULL (terima)        baru | bekas | rusak
--                 baru|bekas|rusak     NULL (serahkan)
--
-- Baris lama / dari aplikasi lain yang tidak mengisi kolom ini memakai default:
--   Masuk -> baru, Pakai -> dari baru, Bekas -> bekas, Rusak -> dari bekas ke rusak,
--   Serah Terima tanpa arah -> tidak mengubah stok.
--
-- Migrasi ini aditif dan kompatibel ke belakang: kolom baru boleh NULL, sehingga
-- versi aplikasi lama dan aplikasi lain tetap bisa menulis seperti sebelumnya.
-- ====================================================================

ALTER TABLE public.stock_mutations
  ADD COLUMN IF NOT EXISTS stok_asal character varying
    CHECK (stok_asal IS NULL OR stok_asal IN ('baru', 'bekas', 'rusak')),
  ADD COLUMN IF NOT EXISTS stok_tujuan character varying
    CHECK (stok_tujuan IS NULL OR stok_tujuan IN ('baru', 'bekas', 'rusak'));

-- Kombinasi asal/tujuan harus sesuai tipe transaksi (NULL = pakai default di atas)
ALTER TABLE public.stock_mutations
  ADD CONSTRAINT stock_mutations_aliran_stok_check CHECK (
    CASE mutation_type
      WHEN 'Masuk' THEN stok_asal IS NULL AND (stok_tujuan IS NULL OR stok_tujuan = 'baru')
      WHEN 'Pakai' THEN (stok_asal IS NULL OR stok_asal = 'baru') AND stok_tujuan IS NULL
      WHEN 'Bekas' THEN stok_asal IS NULL AND (stok_tujuan IS NULL OR stok_tujuan = 'bekas')
      WHEN 'Rusak' THEN (stok_asal IS NULL OR stok_asal IN ('baru', 'bekas'))
                        AND (stok_tujuan IS NULL OR stok_tujuan = 'rusak')
      WHEN 'Serah Terima' THEN stok_asal IS NULL OR stok_tujuan IS NULL
      ELSE true
    END
  );

COMMENT ON COLUMN public.stock_mutations.stok_asal IS
  'Kantong stok yang berkurang: baru | bekas | rusak. NULL = dari luar gudang.';
COMMENT ON COLUMN public.stock_mutations.stok_tujuan IS
  'Kantong stok yang bertambah: baru | bekas | rusak. NULL = keluar dari gudang.';
COMMENT ON COLUMN public.stock_mutations.penerima IS
  'Serah Terima: pihak lain (penerima saat diserahkan, pemberi saat diterima).';
COMMENT ON COLUMN public.stock_mutations.unit_penerima IS
  'Serah Terima: unit pihak lain (penerima saat diserahkan, pemberi saat diterima).';

-- Rekap stok di database, memakai aturan yang sama dengan aplikasi (src/utils/stock.ts)
CREATE OR REPLACE VIEW public.current_stock AS
WITH aliran AS (
  SELECT
    m.sparepart_id,
    m.qty,
    COALESCE(m.stok_asal, CASE m.mutation_type
      WHEN 'Pakai' THEN 'baru'
      WHEN 'Rusak' THEN 'bekas'
    END) AS asal,
    COALESCE(m.stok_tujuan, CASE m.mutation_type
      WHEN 'Masuk' THEN 'baru'
      WHEN 'Bekas' THEN 'bekas'
      WHEN 'Rusak' THEN 'rusak'
    END) AS tujuan
  FROM public.stock_mutations m
)
SELECT
  s.id,
  s.sku,
  s.name,
  COALESCE(sum(CASE WHEN a.tujuan = 'baru'  THEN a.qty ELSE 0 END)
         - sum(CASE WHEN a.asal   = 'baru'  THEN a.qty ELSE 0 END), 0::bigint) AS stok_aktual,
  COALESCE(sum(CASE WHEN a.tujuan = 'bekas' THEN a.qty ELSE 0 END)
         - sum(CASE WHEN a.asal   = 'bekas' THEN a.qty ELSE 0 END), 0::bigint) AS stok_bekas,
  COALESCE(sum(CASE WHEN a.tujuan = 'rusak' THEN a.qty ELSE 0 END)
         - sum(CASE WHEN a.asal   = 'rusak' THEN a.qty ELSE 0 END), 0::bigint) AS stok_rusak
FROM public.spareparts s
LEFT JOIN aliran a ON a.sparepart_id = s.id
GROUP BY s.id, s.sku, s.name;

-- ====================================================================
-- ROLLBACK (jalankan manual bila migrasi perlu dibatalkan)
-- ====================================================================
-- CREATE OR REPLACE VIEW public.current_stock AS
--  SELECT s.id, s.sku, s.name,
--     COALESCE(sum(CASE WHEN m.mutation_type::text = 'Masuk'::text THEN m.qty
--                       WHEN m.mutation_type::text = 'Pakai'::text THEN - m.qty
--                       ELSE 0 END), 0::bigint) AS stok_aktual,
--     COALESCE(sum(CASE WHEN m.mutation_type::text = 'Bekas'::text THEN m.qty ELSE 0 END), 0::bigint) AS stok_bekas,
--     COALESCE(sum(CASE WHEN m.mutation_type::text = 'Rusak'::text THEN m.qty ELSE 0 END), 0::bigint) AS stok_rusak
--    FROM spareparts s
--      LEFT JOIN stock_mutations m ON s.id = m.sparepart_id
--   GROUP BY s.id, s.sku, s.name;
-- ALTER TABLE public.stock_mutations DROP CONSTRAINT IF EXISTS stock_mutations_aliran_stok_check;
-- ALTER TABLE public.stock_mutations DROP COLUMN IF EXISTS stok_asal, DROP COLUMN IF EXISTS stok_tujuan;

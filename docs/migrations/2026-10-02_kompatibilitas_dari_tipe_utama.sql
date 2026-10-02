-- ====================================================================
-- MIGRASI DATA: pindahkan "tipe utama" sparepart ke daftar kompatibel
-- Tanggal : 2026-10-02
-- Status  : BELUM DITERAPKAN, menunggu persetujuan pemilik
--
-- Aplikasi tidak lagi memakai kolom spareparts.id_tipe (tipe utama). Satu-satunya
-- hubungan sparepart <-> tipe peralatan adalah tabel sparepart_compatibility.
-- Sparepart lama yang hanya punya id_tipe dan belum pernah disimpan ulang lewat
-- aplikasi belum punya baris kompatibel; tanpa migrasi ini ia tampil "Umum".
--
-- TERAPKAN SEBELUM kode baru dideploy. Hanya menambah baris; tidak mengubah skema,
-- tidak menghapus apa pun, dan aman dijalankan berulang (tidak membuat duplikat).
-- Kolom spareparts.id_tipe dibiarkan (tidak dibaca dan tidak ditulis lagi).
--
-- Hasil uji (2 Okt 2026, transaksi dibatalkan, juga sebagai anon):
--   sebelum 4 baris -> sesudah 6 baris (SP-003 dan SP-005 masing-masing +1);
--   dijalankan kedua kali menambah 0 baris.
-- ====================================================================

INSERT INTO public.sparepart_compatibility (sparepart_id, id_tipe, is_primary)
SELECT s.id, s.id_tipe, true
FROM public.spareparts s
WHERE s.id_tipe IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sparepart_compatibility c
    WHERE c.sparepart_id = s.id AND c.id_tipe = s.id_tipe
  )
ON CONFLICT (sparepart_id, id_tipe) DO NOTHING;

-- ROLLBACK (hanya baris hasil migrasi ini; cocokkan dengan created_at saat dijalankan):
-- DELETE FROM public.sparepart_compatibility c
-- USING public.spareparts s
-- WHERE c.sparepart_id = s.id AND c.id_tipe = s.id_tipe AND c.created_at >= '<waktu migrasi>';

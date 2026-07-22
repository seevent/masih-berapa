-- ====================================================================
-- SKRIP MIGRASI ALTER TABLE: MENGUBAH SEMUA TABEL EKSISTING DARI TEXT KE UUID
-- Jalankan skrip ini di Supabase SQL Editor jika tabel Anda terlanjur dibuat dengan TEXT!
-- ====================================================================

-- 1. Matikan sementara Foreign Key constraints agar konversi tipe tidak crash:
ALTER TABLE IF EXISTS public.tipe_peralatan DROP CONSTRAINT IF EXISTS tipe_peralatan_id_jenis_fkey;
ALTER TABLE IF EXISTS public.titik_lokasi DROP CONSTRAINT IF EXISTS titik_lokasi_id_lokasi_fkey;
ALTER TABLE IF EXISTS public.unit_peralatan DROP CONSTRAINT IF EXISTS unit_peralatan_id_tipe_fkey;
ALTER TABLE IF EXISTS public.penempatan_peralatan DROP CONSTRAINT IF EXISTS penempatan_peralatan_id_unit_fkey;
ALTER TABLE IF EXISTS public.penempatan_peralatan DROP CONSTRAINT IF EXISTS penempatan_peralatan_id_tipe_fkey;
ALTER TABLE IF EXISTS public.penempatan_peralatan DROP CONSTRAINT IF EXISTS penempatan_peralatan_id_lokasi_fkey;
ALTER TABLE IF EXISTS public.penempatan_peralatan DROP CONSTRAINT IF EXISTS penempatan_peralatan_id_titik_fkey;
ALTER TABLE IF EXISTS public.personel DROP CONSTRAINT IF EXISTS personel_unit_id_fkey;
ALTER TABLE IF EXISTS public.jadwal_shift DROP CONSTRAINT IF EXISTS jadwal_shift_personel_id_fkey;
ALTER TABLE IF EXISTS public.spareparts DROP CONSTRAINT IF EXISTS spareparts_id_tipe_fkey;
ALTER TABLE IF EXISTS public.spareparts DROP CONSTRAINT IF EXISTS spareparts_id_jenis_fkey;
ALTER TABLE IF EXISTS public.stock_mutations DROP CONSTRAINT IF EXISTS stock_mutations_sparepart_id_fkey;
ALTER TABLE IF EXISTS public.stock_mutations DROP CONSTRAINT IF EXISTS stock_mutations_unit_id_fkey;
ALTER TABLE IF EXISTS public.stock_mutations DROP CONSTRAINT IF EXISTS stock_mutations_personel_id_fkey;

-- 2. Konversi Primary Key ke UUID (dengan generate random UUID jika data bukan format UUID):
ALTER TABLE public.jenis_peralatan ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.tipe_peralatan ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.lokasi ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.titik_lokasi ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.unit_peralatan ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.unit_kerja ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.personel ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.jadwal_shift ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.spareparts ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.stock_mutations ALTER COLUMN id TYPE UUID USING gen_random_uuid();

-- 3. Set default gen_random_uuid() untuk semua Primary Key:
ALTER TABLE public.jenis_peralatan ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.tipe_peralatan ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.lokasi ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.titik_lokasi ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.unit_peralatan ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.unit_kerja ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.personel ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.jadwal_shift ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.spareparts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.stock_mutations ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Konversi Foreign Key Columns ke UUID:
ALTER TABLE public.tipe_peralatan ALTER COLUMN id_jenis TYPE UUID USING gen_random_uuid();
ALTER TABLE public.titik_lokasi ALTER COLUMN id_lokasi TYPE UUID USING gen_random_uuid();
ALTER TABLE public.unit_peralatan ALTER COLUMN id_tipe TYPE UUID USING gen_random_uuid();
ALTER TABLE public.personel ALTER COLUMN unit_id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.jadwal_shift ALTER COLUMN personel_id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.spareparts ALTER COLUMN id_tipe TYPE UUID USING gen_random_uuid();
ALTER TABLE public.spareparts ALTER COLUMN id_jenis TYPE UUID USING gen_random_uuid();
ALTER TABLE public.stock_mutations ALTER COLUMN sparepart_id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.stock_mutations ALTER COLUMN unit_id TYPE UUID USING gen_random_uuid();
ALTER TABLE public.stock_mutations ALTER COLUMN personel_id TYPE UUID USING gen_random_uuid();

-- 5. Aktifkan kembali Foreign Key constraints:
ALTER TABLE public.tipe_peralatan ADD CONSTRAINT tipe_peralatan_id_jenis_fkey FOREIGN KEY (id_jenis) REFERENCES public.jenis_peralatan(id) ON DELETE CASCADE;
ALTER TABLE public.titik_lokasi ADD CONSTRAINT titik_lokasi_id_lokasi_fkey FOREIGN KEY (id_lokasi) REFERENCES public.lokasi(id) ON DELETE CASCADE;
ALTER TABLE public.unit_peralatan ADD CONSTRAINT unit_peralatan_id_tipe_fkey FOREIGN KEY (id_tipe) REFERENCES public.tipe_peralatan(id) ON DELETE SET NULL;
ALTER TABLE public.personel ADD CONSTRAINT personel_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit_kerja(id) ON DELETE SET NULL;
ALTER TABLE public.jadwal_shift ADD CONSTRAINT jadwal_shift_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;
ALTER TABLE public.spareparts ADD CONSTRAINT spareparts_id_tipe_fkey FOREIGN KEY (id_tipe) REFERENCES public.tipe_peralatan(id) ON DELETE SET NULL;
ALTER TABLE public.spareparts ADD CONSTRAINT spareparts_id_jenis_fkey FOREIGN KEY (id_jenis) REFERENCES public.jenis_peralatan(id) ON DELETE SET NULL;
ALTER TABLE public.stock_mutations ADD CONSTRAINT stock_mutations_sparepart_id_fkey FOREIGN KEY (sparepart_id) REFERENCES public.spareparts(id) ON DELETE CASCADE;
ALTER TABLE public.stock_mutations ADD CONSTRAINT stock_mutations_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit_peralatan(id) ON DELETE SET NULL;
ALTER TABLE public.stock_mutations ADD CONSTRAINT stock_mutations_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE SET NULL;

-- 6. Tambahkan kolom supplier_type jika belum ada:
ALTER TABLE public.spareparts ADD COLUMN IF NOT EXISTS supplier_type VARCHAR(50) DEFAULT 'LOKAL';


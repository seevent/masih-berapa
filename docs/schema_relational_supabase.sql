-- ====================================================================
-- SKEMA SUPABASE POSTGRESQL (EXACT MATCH DENGAN DATABASE SUPABASE SAAT INI)
-- Aplikasi: SSES T2 Sparepart Management ("Masih Berapa")
-- ====================================================================

-- 1. Master Jenis Peralatan
CREATE TABLE IF NOT EXISTS public.jenis_peralatan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama character varying NOT NULL UNIQUE,
  tampil_di_kalibrasi boolean DEFAULT false,
  CONSTRAINT jenis_peralatan_pkey PRIMARY KEY (id)
);

-- 2. Master Tipe Peralatan
CREATE TABLE IF NOT EXISTS public.tipe_peralatan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_jenis uuid,
  nama character varying NOT NULL UNIQUE,
  varian text,
  CONSTRAINT tipe_peralatan_pkey PRIMARY KEY (id),
  CONSTRAINT tipe_peralatan_id_jenis_fkey FOREIGN KEY (id_jenis) REFERENCES public.jenis_peralatan(id)
);

-- 3. Master Lokasi & Titik Lokasi
CREATE TABLE IF NOT EXISTS public.lokasi (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama character varying NOT NULL UNIQUE,
  CONSTRAINT lokasi_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.titik_lokasi (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_lokasi uuid,
  nomor character varying NOT NULL,
  CONSTRAINT titik_lokasi_pkey PRIMARY KEY (id),
  CONSTRAINT titik_lokasi_id_lokasi_fkey FOREIGN KEY (id_lokasi) REFERENCES public.lokasi(id)
);

-- 4. Unit Peralatan Fisik
CREATE TABLE IF NOT EXISTS public.unit_peralatan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_tipe uuid NOT NULL,
  serial_number character varying,
  no_sertifikasi character varying,
  tahun_instalasi integer,
  milik character varying DEFAULT 'Injourney / AP2'::character varying,
  status character varying NOT NULL DEFAULT 'operasi'::character varying CHECK (status::text = ANY (ARRAY['operasi'::character varying, 'standby'::character varying, 'gudang'::character varying, 'rusak'::character varying]::text[])),
  catatan text,
  foto_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ampere character varying,
  CONSTRAINT unit_peralatan_pkey PRIMARY KEY (id),
  CONSTRAINT unit_peralatan_id_tipe_fkey FOREIGN KEY (id_tipe) REFERENCES public.tipe_peralatan(id)
);

-- 5. Penempatan Unit Peralatan
CREATE TABLE IF NOT EXISTS public.penempatan_peralatan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_tipe uuid,
  id_lokasi uuid,
  id_titik uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  id_unit uuid,
  CONSTRAINT penempatan_peralatan_pkey PRIMARY KEY (id),
  CONSTRAINT penempatan_peralatan_id_tipe_fkey FOREIGN KEY (id_tipe) REFERENCES public.tipe_peralatan(id),
  CONSTRAINT penempatan_peralatan_id_lokasi_fkey FOREIGN KEY (id_lokasi) REFERENCES public.lokasi(id),
  CONSTRAINT penempatan_peralatan_id_titik_fkey FOREIGN KEY (id_titik) REFERENCES public.titik_lokasi(id),
  CONSTRAINT penempatan_peralatan_id_unit_fkey FOREIGN KEY (id_unit) REFERENCES public.unit_peralatan(id)
);

-- 6. Unit Kerja & Personel
CREATE TABLE IF NOT EXISTS public.unit_kerja (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unit_kerja_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.personel (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nik text NOT NULL UNIQUE,
  nama text NOT NULL,
  no_hp text,
  unit_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  jabatan character varying,
  urutan integer,
  CONSTRAINT personel_pkey PRIMARY KEY (id),
  CONSTRAINT personel_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit_kerja(id)
);

-- 7. Jadwal Shift
CREATE TABLE IF NOT EXISTS public.jadwal_shift (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  personel_id uuid,
  tanggal date NOT NULL,
  shift text NOT NULL,
  status_kehadiran text DEFAULT 'Hadir'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT jadwal_shift_pkey PRIMARY KEY (id),
  CONSTRAINT jadwal_shift_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id)
);

-- 8. Master Configs
CREATE TABLE IF NOT EXISTS public.master_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT master_configs_pkey PRIMARY KEY (id)
);

-- 9. Master Inventaris Sparepart
CREATE TABLE IF NOT EXISTS public.spareparts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sku character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  description text,
  id_tipe uuid,
  id_jenis uuid,
  unit character varying DEFAULT 'PCS'::character varying,
  stok_aktual integer NOT NULL DEFAULT 0 CHECK (stok_aktual >= 0),
  stok_bekas integer NOT NULL DEFAULT 0 CHECK (stok_bekas >= 0),
  minimum_stok integer NOT NULL DEFAULT 1 CHECK (minimum_stok >= 0),
  lokasi character varying,
  sumber character varying DEFAULT 'VENDOR'::character varying CHECK (sumber::text = ANY (ARRAY['SUP API'::character varying, 'SISA PEKERJAAN'::character varying, 'IAS'::character varying, 'MANDIRI'::character varying, 'DARI UNIT LAIN'::character varying, 'VENDOR'::character varying, 'LOKAL'::character varying, 'IMPOR'::character varying]::text[])),
  mtbf_days integer DEFAULT 180,
  last_replaced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  rack character varying,
  CONSTRAINT spareparts_pkey PRIMARY KEY (id),
  CONSTRAINT spareparts_id_tipe_fkey FOREIGN KEY (id_tipe) REFERENCES public.tipe_peralatan(id),
  CONSTRAINT spareparts_id_jenis_fkey FOREIGN KEY (id_jenis) REFERENCES public.jenis_peralatan(id)
);

-- 10. Transaksi Mutasi Stok
CREATE TABLE IF NOT EXISTS public.stock_mutations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sparepart_id uuid NOT NULL,
  unit_id uuid,
  personel_id uuid,
  mutation_type character varying NOT NULL CHECK (mutation_type::text = ANY (ARRAY['Masuk'::character varying, 'Pakai'::character varying, 'Bekas'::character varying, 'Rusak'::character varying]::text[])),
  qty integer NOT NULL CHECK (qty > 0),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_mutations_pkey PRIMARY KEY (id),
  CONSTRAINT stock_mutations_sparepart_id_fkey FOREIGN KEY (sparepart_id) REFERENCES public.spareparts(id),
  CONSTRAINT stock_mutations_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit_peralatan(id),
  CONSTRAINT stock_mutations_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id)
);

-- 11. Kompatibilitas Sparepart
CREATE TABLE IF NOT EXISTS public.sparepart_compatibility (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sparepart_id uuid NOT NULL,
  id_tipe uuid NOT NULL,
  is_primary boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sparepart_compatibility_pkey PRIMARY KEY (id),
  CONSTRAINT sparepart_compatibility_sparepart_id_fkey FOREIGN KEY (sparepart_id) REFERENCES public.spareparts(id),
  CONSTRAINT sparepart_compatibility_id_tipe_fkey FOREIGN KEY (id_tipe) REFERENCES public.tipe_peralatan(id)
);

-- Disable Row Level Security (RLS) untuk akses ANON/Public API yang seamless
ALTER TABLE public.jenis_peralatan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipe_peralatan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lokasi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.titik_lokasi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_peralatan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.penempatan_peralatan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_kerja DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personel DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_shift DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.spareparts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_mutations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sparepart_compatibility DISABLE ROW LEVEL SECURITY;

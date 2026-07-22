-- ====================================================================
-- SKRIP MIGRASI SQL DDL: TABEL PUBLIC.SPAREPARTS
-- Menyesuaikan struktur tabel spareparts persis seperti spesifikasi baru Anda:
-- - Primary Key: id UUID DEFAULT gen_random_uuid()
-- - Foreign Key: id_tipe UUID NOT NULL REFERENCES tipe_peralatan(id)
-- - Foreign Key: id_jenis UUID NOT NULL REFERENCES jenis_peralatan(id)
-- - Penataan Kolom Lokasi: location (VARCHAR) & rack (VARCHAR)
-- - Tanpa kolom unit_price (100% Non-Finansial)
-- ====================================================================

-- OPSIONAL A: JIKA INGIN MEMBUAT DENGAN TABEL BARU / UMBAND (DROP & RECREATE):
DROP TABLE IF EXISTS public.spareparts CASCADE;

CREATE TABLE public.spareparts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sku character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  description text,
  id_tipe uuid NOT NULL,
  id_jenis uuid NOT NULL,
  unit character varying DEFAULT 'PCS'::character varying,
  stok_aktual integer NOT NULL DEFAULT 0 CHECK (stok_aktual >= 0),
  stok_bekas integer NOT NULL DEFAULT 0 CHECK (stok_bekas >= 0),
  minimum_stok integer NOT NULL DEFAULT 1 CHECK (minimum_stok >= 0),
  location character varying,
  rack character varying,
  mtbf_days integer DEFAULT 180,
  last_replaced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT spareparts_pkey PRIMARY KEY (id),
  CONSTRAINT spareparts_id_tipe_fkey FOREIGN KEY (id_tipe) REFERENCES public.tipe_peralatan(id),
  CONSTRAINT spareparts_id_jenis_fkey FOREIGN KEY (id_jenis) REFERENCES public.jenis_peralatan(id)
);

-- Index performa pencarian SKU dan Foreign Key
CREATE INDEX IF NOT EXISTS idx_spareparts_sku ON public.spareparts(sku);
CREATE INDEX IF NOT EXISTS idx_spareparts_tipe ON public.spareparts(id_tipe);
CREATE INDEX IF NOT EXISTS idx_spareparts_jenis ON public.spareparts(id_jenis);
CREATE INDEX IF NOT EXISTS idx_spareparts_rack ON public.spareparts(rack);


-- OPSIONAL B: JIKA TABEL EKSISTING SPAREPARTS SUDAH ADA & INGIN MENGUBAHNYA TANPA DROP:
/*
-- 1. Lepas sementara constraint FK lama
ALTER TABLE public.spareparts DROP CONSTRAINT IF EXISTS spareparts_id_tipe_fkey;
ALTER TABLE public.spareparts DROP CONSTRAINT IF EXISTS spareparts_id_jenis_fkey;

-- 2. Tambah/Ubah kolom location dan rack
ALTER TABLE public.spareparts ADD COLUMN IF NOT EXISTS location character varying;
ALTER TABLE public.spareparts ADD COLUMN IF NOT EXISTS rack character varying;

-- 3. Hapus unit_price dan location_rack jika ada
ALTER TABLE public.spareparts DROP COLUMN IF EXISTS unit_price;
ALTER TABLE public.spareparts DROP COLUMN IF EXISTS location_rack;

-- 4. Ubah id_tipe dan id_jenis ke UUID NOT NULL
ALTER TABLE public.spareparts 
  ALTER COLUMN id_tipe TYPE uuid USING id_tipe::uuid,
  ALTER COLUMN id_jenis TYPE uuid USING id_jenis::uuid,
  ALTER COLUMN id_tipe SET NOT NULL,
  ALTER COLUMN id_jenis SET NOT NULL;

-- 5. Pasang kembali constraint FK
ALTER TABLE public.spareparts 
  ADD CONSTRAINT spareparts_id_tipe_fkey FOREIGN KEY (id_tipe) REFERENCES public.tipe_peralatan(id),
  ADD CONSTRAINT spareparts_id_jenis_fkey FOREIGN KEY (id_jenis) REFERENCES public.jenis_peralatan(id);
*/

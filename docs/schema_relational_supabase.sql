-- ====================================================================
-- SKEMA SUPABASE POSTGRESQL RELASIONAL (100% PURIFIED UUID PRIMARY KEYS)
-- Aplikasi: SSES T2 Sparepart Management ("Masih Berapa")
-- ====================================================================

-- Enable UUID extension (biasanya default aktif di Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Master Jenis Peralatan
CREATE TABLE IF NOT EXISTS public.jenis_peralatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    tampil_di_kalibrasi BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Master Tipe Peralatan
CREATE TABLE IF NOT EXISTS public.tipe_peralatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_jenis UUID REFERENCES public.jenis_peralatan(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    varian VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Master Lokasi & Titik Lokasi
CREATE TABLE IF NOT EXISTS public.lokasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.titik_lokasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_lokasi UUID REFERENCES public.lokasi(id) ON DELETE CASCADE,
    nomor VARCHAR(255) NOT NULL
);

-- 4. Unit Peralatan Fisik
CREATE TABLE IF NOT EXISTS public.unit_peralatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_tipe UUID REFERENCES public.tipe_peralatan(id) ON DELETE SET NULL,
    serial_number VARCHAR(255),
    no_sertifikasi VARCHAR(255),
    tahun_instalasi INT,
    milik VARCHAR(255),
    status VARCHAR(50) DEFAULT 'operasi' CHECK (status IN ('operasi', 'standby', 'gudang', 'rusak')),
    catatan TEXT,
    foto_url TEXT,
    ampere VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Penempatan Unit Peralatan
CREATE TABLE IF NOT EXISTS public.penempatan_peralatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_unit UUID REFERENCES public.unit_peralatan(id) ON DELETE CASCADE,
    id_tipe UUID REFERENCES public.tipe_peralatan(id) ON DELETE SET NULL,
    id_lokasi UUID REFERENCES public.lokasi(id) ON DELETE SET NULL,
    id_titik UUID REFERENCES public.titik_lokasi(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Unit Kerja & Personel
CREATE TABLE IF NOT EXISTS public.unit_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.personel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik VARCHAR(100) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    no_hp VARCHAR(50),
    unit_id UUID REFERENCES public.unit_kerja(id) ON DELETE SET NULL,
    jabatan VARCHAR(255),
    urutan INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Jadwal Shift
CREATE TABLE IF NOT EXISTS public.jadwal_shift (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personel_id UUID REFERENCES public.personel(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    shift VARCHAR(50) CHECK (shift IN ('Pagi', 'Siang', 'Malam', 'Off')),
    status_kehadiran VARCHAR(100) DEFAULT 'Hadir',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Master Configs
CREATE TABLE IF NOT EXISTS public.master_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Master Inventaris Sparepart
CREATE TABLE IF NOT EXISTS public.spareparts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    id_tipe UUID REFERENCES public.tipe_peralatan(id) ON DELETE CASCADE,
    id_jenis UUID REFERENCES public.jenis_peralatan(id) ON DELETE CASCADE,
    unit VARCHAR(50) DEFAULT 'PCS',
    stok_aktual INT NOT NULL DEFAULT 0 CHECK (stok_aktual >= 0),
    stok_bekas INT NOT NULL DEFAULT 0 CHECK (stok_bekas >= 0),
    minimum_stok INT NOT NULL DEFAULT 1 CHECK (minimum_stok >= 0),
    location VARCHAR(255),
    rack VARCHAR(255),
    supplier_type VARCHAR(50) DEFAULT 'LOKAL' CHECK (supplier_type IN ('LOKAL', 'IMPOR')),
    mtbf_days INT DEFAULT 180,
    last_replaced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spareparts_sku ON public.spareparts(sku);
CREATE INDEX IF NOT EXISTS idx_spareparts_tipe ON public.spareparts(id_tipe);
CREATE INDEX IF NOT EXISTS idx_spareparts_jenis ON public.spareparts(id_jenis);
CREATE INDEX IF NOT EXISTS idx_spareparts_rack ON public.spareparts(rack);

-- 10. Transaksi Mutasi Stok
CREATE TABLE IF NOT EXISTS public.stock_mutations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sparepart_id UUID NOT NULL REFERENCES public.spareparts(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.unit_peralatan(id) ON DELETE SET NULL,
    personel_id UUID REFERENCES public.personel(id) ON DELETE SET NULL,
    mutation_type VARCHAR(50) NOT NULL CHECK (mutation_type IN ('INBOUND', 'OUTBOUND', 'ROTABLE_RETURN', 'SCRAP')),
    qty INT NOT NULL CHECK (qty > 0),
    operator_name VARCHAR(255) NOT NULL,
    reference_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mutations_sparepart ON public.stock_mutations(sparepart_id);
CREATE INDEX IF NOT EXISTS idx_mutations_created ON public.stock_mutations(created_at DESC);

-- 11. Kompatibilitas Sparepart (Many-to-Many Sparepart <-> Tipe Peralatan)
CREATE TABLE IF NOT EXISTS public.sparepart_compatibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sparepart_id UUID NOT NULL REFERENCES public.spareparts(id) ON DELETE CASCADE,
    id_tipe UUID NOT NULL REFERENCES public.tipe_peralatan(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sparepart_id, id_tipe)
);

-- 12. Pengajuan Reorder Kuantitas Fisik (Purchase Requisitions)
CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_number VARCHAR(100) UNIQUE NOT NULL,
    sparepart_id UUID NOT NULL REFERENCES public.spareparts(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.personel(id) ON DELETE SET NULL,
    requested_qty INT NOT NULL CHECK (requested_qty > 0),
    urgency VARCHAR(50) DEFAULT 'WARNING' CHECK (urgency IN ('CRITICAL', 'WARNING', 'ROUTINE')),
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- HAK AKSES ANON / PUBLIC ROW LEVEL SECURITY (RLS) POLICIES
-- Memungkinkan akses Read/Write via Anon Public Key dari aplikasi React
-- ====================================================================

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
ALTER TABLE public.purchase_requisitions DISABLE ROW LEVEL SECURITY;

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  JenisPeralatan,
  TipePeralatan,
  Lokasi,
  TitikLokasi,
  UnitPeralatan,
  PenempatanPeralatan,
  UnitKerja,
  Personel,
  JadwalShift,
  MasterConfig,
  Sparepart,
  StockMutation,
  SparepartCompatibility,
  MutationType,
  SupplierType
} from '../types';
import { getSupabaseClient, fetchAllRows } from '../lib/supabase';
import { computeStockBySparepart, findNegativeStock, StockFlow } from '../utils/stock';
import { autoMinimumStock, buildPredictiveReport, demandRate, PredictiveReport, ReliabilityMutation } from '../utils/reliability';
import { requiresEquipmentUnit } from '../utils/compatibility';
import { extractManualPetugas, withManualPetugas } from '../utils/shiftUtils';
import { useNotification } from './NotificationContext';

/** Fields of a sparepart that are stored in the `spareparts` table. */
export interface SparepartFormInput {
  sku: string;
  name: string;
  description?: string;
  unit?: string;
  lokasi?: string;
  rack?: string;
  /** Compatible tipe peralatan (written to sparepart_compatibility). */
  tipeIds: string[];
}

export interface NewSparepartInput extends SparepartFormInput {
  stok_awal_baru: number;
  stok_awal_bekas: number;
}

/** One sparepart line of a transaction ("nota"). */
export interface MutationLineInput {
  sparepart_id: string;
  qty: number;
  /** Which stock bucket decreases / increases (see resolveStockFlow) */
  flow: StockFlow;
  /** Masuk bekas/rusak: unit the part was removed from (optional) */
  unit_id?: string | null;
  /** Masuk bekas/rusak: origin of the part (optional); baru lines use the transaction's `sumber` */
  sumber?: SupplierType | null;
}

/** A transaction with one or more lines; saved as one stock_mutations row per line, all or nothing. */
export interface NewTransactionInput {
  mutation_type: MutationType;
  lines: MutationLineInput[];
  personel_id?: string;
  /** Hand-written officer name, only when no schedule/personel is available; stored as "[Petugas: ...]" in notes */
  petugas_manual?: string;
  /** Pakai: the unit all lines are installed in (required) */
  unit_id?: string;
  /** Masuk: origin of the new stock (written on lines going to stok baru; required there, defaults to VENDOR) */
  sumber?: SupplierType;
  /** Serah Terima: the other party and their unit */
  penerima?: string;
  unit_penerima?: string;
  reference_no?: string;
  notes?: string;
}

export interface MutationUpdateInput {
  mutation_type: MutationType;
  flow: StockFlow;
  sumber?: SupplierType | null;
  qty: number;
  personel_id?: string | null;
  /** Required for 'Pakai' */
  unit_id: string | null;
  penerima?: string | null;
  unit_penerima?: string | null;
  notes?: string | null;
}

interface InventoryContextType {
  // State Data
  jenisPeralatan: JenisPeralatan[];
  tipePeralatan: TipePeralatan[];
  lokasiList: Lokasi[];
  titikLokasiList: TitikLokasi[];
  unitPeralatanList: UnitPeralatan[];
  penempatanList: PenempatanPeralatan[];
  unitKerjaList: UnitKerja[];
  personelList: Personel[];
  jadwalShiftList: JadwalShift[];
  masterConfigs: MasterConfig[];
  spareparts: Sparepart[];
  mutations: StockMutation[];
  sparepartCompatibility: SparepartCompatibility[];

  isLoading: boolean;
  isSupabaseConnected: boolean;

  // Actions
  addJenisPeralatan: (data: Omit<JenisPeralatan, 'id'>) => Promise<void>;
  addTipePeralatan: (data: Omit<TipePeralatan, 'id'>) => Promise<void>;
  addLokasi: (data: Omit<Lokasi, 'id'>) => Promise<void>;
  addTitikLokasi: (data: Omit<TitikLokasi, 'id'>) => Promise<void>;
  addUnitPeralatan: (data: Omit<UnitPeralatan, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateUnitStatus: (id: string, status: UnitPeralatan['status']) => Promise<void>;
  addPersonel: (data: Omit<Personel, 'id' | 'created_at'>) => Promise<void>;
  addJadwalShift: (data: Omit<JadwalShift, 'id' | 'created_at'>) => Promise<void>;

  addSparepart: (part: NewSparepartInput) => Promise<boolean>;
  updateSparepart: (id: string, part: SparepartFormInput) => Promise<boolean>;
  deleteSparepart: (id: string) => Promise<boolean>;

  addMutations: (input: NewTransactionInput) => Promise<boolean>;
  updateMutation: (id: string, data: MutationUpdateInput) => Promise<boolean>;
  deleteMutation: (id: string) => Promise<boolean>;

  // Calculations (predictive maintenance, see utils/reliability.ts)
  predictive: PredictiveReport;
  refreshData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface StockRow {
  id: string;
  sparepart_id: string;
  mutation_type: MutationType;
  qty: number;
  stok_asal?: string | null;
  stok_tujuan?: string | null;
}

/** Reads all mutations of one sparepart straight from the database (fresh, not cached state). */
const fetchSparepartMutations = (supabase: SupabaseClient, sparepartId: string) =>
  fetchAllRows<StockRow>(() =>
    supabase
      .from('stock_mutations')
      .select('id, sparepart_id, mutation_type, qty, stok_asal, stok_tujuan')
      .eq('sparepart_id', sparepartId)
      .order('id', { ascending: true })
  );

/** Reads all mutations of several spareparts straight from the database. */
const fetchMutationsOf = (supabase: SupabaseClient, sparepartIds: string[]) =>
  fetchAllRows<StockRow>(() =>
    supabase
      .from('stock_mutations')
      .select('id, sparepart_id, mutation_type, qty, stok_asal, stok_tujuan')
      .in('sparepart_id', sparepartIds)
      .order('id', { ascending: true })
  );

/** Returns an error message when the given mutations would leave negative stock, otherwise null. */
const validateStock = (muts: StockRow[], sparepartId: string): string | null =>
  findNegativeStock(computeStockBySparepart(muts)[sparepartId] || { baru: 0, bekas: 0, rusak: 0 });

/** Fields written to the database for the stock flow of a mutation. */
const flowColumns = (type: MutationType, flow: StockFlow, penerima?: string | null, unitPenerima?: string | null) => ({
  stok_asal: flow.asal,
  stok_tujuan: flow.tujuan,
  // The other party only applies to Serah Terima
  penerima: type === 'Serah Terima' ? penerima?.trim() || null : null,
  unit_penerima: type === 'Serah Terima' ? unitPenerima?.trim() || null : null
});

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useNotification();
  // showToast is recreated on every render of NotificationProvider; keep a stable reference
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const [jenisPeralatan, setJenisPeralatan] = useState<JenisPeralatan[]>([]);
  const [tipePeralatan, setTipePeralatan] = useState<TipePeralatan[]>([]);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [titikLokasiList, setTitikLokasiList] = useState<TitikLokasi[]>([]);
  const [unitPeralatanList, setUnitPeralatanList] = useState<UnitPeralatan[]>([]);
  const [penempatanList, setPenempatanList] = useState<PenempatanPeralatan[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [personelList, setPersonelList] = useState<Personel[]>([]);
  const [jadwalShiftList, setJadwalShiftList] = useState<JadwalShift[]>([]);
  const [masterConfigs, setMasterConfigs] = useState<MasterConfig[]>([]);
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [sparepartCompatibility, setSparepartCompatibilityState] = useState<SparepartCompatibility[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // --- Fetch all data from Supabase PostgreSQL ---
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    if (!supabase) {
      setIsSupabaseConnected(false);
      setJenisPeralatan([]);
      setTipePeralatan([]);
      setLokasiList([]);
      setTitikLokasiList([]);
      setUnitPeralatanList([]);
      setPenempatanList([]);
      setUnitKerjaList([]);
      setPersonelList([]);
      setJadwalShiftList([]);
      setMasterConfigs([]);
      setSpareparts([]);
      setMutations([]);
      setSparepartCompatibilityState([]);
      setIsLoading(false);
      return;
    }

    try {
      const [
        jpRes, tpRes, lokRes, titRes, unitRes, penRes, ukRes, persRes, shfRes, cfgRes, spRes, mutRes, compatRes
      ] = await Promise.all([
        fetchAllRows<JenisPeralatan>(() => supabase.from('jenis_peralatan').select('*').order('nama').order('id')),
        fetchAllRows<TipePeralatan>(() => supabase.from('tipe_peralatan').select('*').order('nama').order('id')),
        fetchAllRows<Lokasi>(() => supabase.from('lokasi').select('*').order('nama').order('id')),
        fetchAllRows<TitikLokasi>(() => supabase.from('titik_lokasi').select('*').order('nomor').order('id')),
        fetchAllRows<UnitPeralatan>(() => supabase.from('unit_peralatan').select('*').order('id')),
        fetchAllRows<PenempatanPeralatan>(() => supabase.from('penempatan_peralatan').select('*').order('id')),
        fetchAllRows<UnitKerja>(() => supabase.from('unit_kerja').select('*').order('nama').order('id')),
        fetchAllRows<Personel>(() => supabase.from('personel').select('*').order('urutan', { nullsFirst: false }).order('nama').order('id')),
        fetchAllRows<JadwalShift>(() => supabase.from('jadwal_shift').select('*').order('tanggal').order('id')),
        fetchAllRows<MasterConfig>(() => supabase.from('master_configs').select('*').order('id')),
        fetchAllRows<any>(() => supabase.from('spareparts').select('*').order('created_at', { ascending: false }).order('id')),
        fetchAllRows<any>(() => supabase.from('stock_mutations').select('*').order('created_at', { ascending: false }).order('id')),
        fetchAllRows<SparepartCompatibility>(() => supabase.from('sparepart_compatibility').select('*').order('id'))
      ]);

      // Stock is derived from stock_mutations, so a failed spareparts/mutations read must never
      // be shown as if it were real data.
      const criticalErrors = [
        ['jenis_peralatan', jpRes.error],
        ['tipe_peralatan', tpRes.error],
        ['spareparts', spRes.error],
        ['stock_mutations', mutRes.error]
      ].filter(([, err]) => err) as Array<[string, { message: string }]>;

      if (criticalErrors.length > 0) {
        console.error('Supabase fetch error:', criticalErrors);
        setIsSupabaseConnected(false);
        showToastRef.current(
          'Gagal Memuat Data',
          criticalErrors.map(([table, err]) => `${table}: ${err.message}`).join(' | '),
          'error'
        );
        return;
      }

      const optionalErrors = [
        ['lokasi', lokRes.error],
        ['titik_lokasi', titRes.error],
        ['unit_peralatan', unitRes.error],
        ['penempatan_peralatan', penRes.error],
        ['unit_kerja', ukRes.error],
        ['personel', persRes.error],
        ['jadwal_shift', shfRes.error],
        ['master_configs', cfgRes.error],
        ['sparepart_compatibility', compatRes.error]
      ].filter(([, err]) => err) as Array<[string, { message: string }]>;

      if (optionalErrors.length > 0) {
        console.error('Supabase partial fetch error:', optionalErrors);
        showToastRef.current(
          'Sebagian Data Gagal Dimuat',
          optionalErrors.map(([table, err]) => `${table}: ${err.message}`).join(' | '),
          'warning'
        );
      }

      setIsSupabaseConnected(true);
      setJenisPeralatan(jpRes.data);
      setTipePeralatan(tpRes.data);
      setLokasiList(lokRes.data);
      setTitikLokasiList(titRes.data);
      setUnitPeralatanList(unitRes.data);
      setPenempatanList(penRes.data);
      setUnitKerjaList(ukRes.data);
      setPersonelList(persRes.data);
      setJadwalShiftList(shfRes.data);
      setMasterConfigs(cfgRes.data);

      const tpMap = new Map(tpRes.data.map((t) => [t.id, t]));
      const persMap = new Map(persRes.data.map((p) => [p.id, p.nama]));
      const mutsData = mutRes.data;

      // Stock per sparepart is the sum of its stock_mutations history
      const stockMap = computeStockBySparepart(mutsData);

      // Compatible tipe per sparepart (the only link between a sparepart and equipment types)
      const compatBySparepart = new Map<string, Set<string>>();
      compatRes.data.forEach((c) => {
        const set = compatBySparepart.get(c.sparepart_id);
        if (set) set.add(c.id_tipe);
        else compatBySparepart.set(c.sparepart_id, new Set([c.id_tipe]));
      });
      const jpMap = new Map(jpRes.data.map((j) => [j.id, j]));

      // Minimum stock is derived from usage (reliability.ts), not read from the manual column
      const mutsBySparepart = new Map<string, ReliabilityMutation[]>();
      mutsData.forEach((m: any) => {
        const list = mutsBySparepart.get(m.sparepart_id);
        if (list) list.push(m);
        else mutsBySparepart.set(m.sparepart_id, [m]);
      });
      const nowMs = Date.now();

      const formattedParts: Sparepart[] = spRes.data.map((sp: any) => {
        const tipes = Array.from(compatBySparepart.get(sp.id) || [])
          .map((id) => tpMap.get(id))
          .filter((t): t is TipePeralatan => Boolean(t))
          .sort((a, b) => a.nama.localeCompare(b.nama));
        const jenisIds = Array.from(new Set(tipes.map((t) => t.id_jenis).filter(Boolean)));
        const stock = stockMap[sp.id] || { baru: 0, bekas: 0, rusak: 0 };
        // Legacy columns that are no longer used: MTBF is derived from stock_mutations
        // (utils/reliability.ts) and the equipment type comes from sparepart_compatibility.
        const { mtbf_days, last_replaced_at, id_tipe, minimum_stok: legacyMinimum, ...row } = sp;

        return {
          ...row,
          tipe_ids: tipes.map((t) => t.id),
          jenis_ids: jenisIds,
          equipment_type_name: tipes.length > 0 ? tipes.map((t) => t.nama).join(', ') : 'Umum',
          jenis_name:
            jenisIds.length > 0 ? jenisIds.map((id) => jpMap.get(id)?.nama || '-').join(', ') : 'Umum',
          lokasi: sp.lokasi || '',
          rack: sp.rack || '',
          minimum_stok: autoMinimumStock(demandRate(mutsBySparepart.get(sp.id) || [], nowMs)),
          stok_aktual: Math.max(0, stock.baru),
          stok_bekas: Math.max(0, stock.bekas),
          stok_rusak: Math.max(0, stock.rusak)
        };
      });

      const spMap = new Map(formattedParts.map((sp) => [sp.id, sp]));
      const formattedMuts: StockMutation[] = mutsData.map((mut: any) => ({
        ...mut,
        qty: Number(mut.qty) || 0,
        sumber: mut.sumber || null,
        operator_name:
          (mut.personel_id && persMap.get(mut.personel_id)) || extractManualPetugas(mut.notes) || mut.penerima || 'Teknisi',
        sparepart_sku: spMap.get(mut.sparepart_id)?.sku || 'UNKNOWN',
        sparepart_name: spMap.get(mut.sparepart_id)?.name || 'Sparepart Removed'
      }));

      setSpareparts(formattedParts);
      setMutations(formattedMuts);
      setSparepartCompatibilityState(compatRes.data);
    } catch (err: any) {
      console.error('Failed to sync with Supabase PostgreSQL:', err);
      setIsSupabaseConnected(false);
      showToastRef.current('Gagal Terhubung ke Supabase', err?.message || String(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  /** Returns the client or shows a toast when Supabase is not configured. */
  const requireClient = (): SupabaseClient | null => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast('Koneksi Gagal', 'VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY belum diisi di file .env.', 'error');
    }
    return supabase;
  };

  // --- Master data ---

  const insertMaster = async (table: string, row: Record<string, any>, title: string, label: string) => {
    const supabase = requireClient();
    if (!supabase) return;
    const { error } = await supabase.from(table).insert([row]);
    if (error) {
      showToast('Gagal Simpan', error.message, 'error');
    } else {
      showToast(title, label, 'success');
      await refreshData();
    }
  };

  const addJenisPeralatan = (data: Omit<JenisPeralatan, 'id'>) =>
    insertMaster('jenis_peralatan', { ...data, id: crypto.randomUUID() }, 'Jenis Peralatan Ditambah', data.nama);

  const addTipePeralatan = (data: Omit<TipePeralatan, 'id'>) =>
    insertMaster(
      'tipe_peralatan',
      { id: crypto.randomUUID(), id_jenis: data.id_jenis, nama: data.nama, varian: data.varian || null },
      'Tipe Peralatan Ditambah',
      data.nama
    );

  const addLokasi = (data: Omit<Lokasi, 'id'>) =>
    insertMaster('lokasi', { ...data, id: crypto.randomUUID() }, 'Lokasi Ditambah', data.nama);

  const addTitikLokasi = (data: Omit<TitikLokasi, 'id'>) =>
    insertMaster(
      'titik_lokasi',
      { id: crypto.randomUUID(), id_lokasi: data.id_lokasi, nomor: data.nomor },
      'Titik Lokasi Ditambah',
      data.nomor
    );

  const addUnitPeralatan = (data: Omit<UnitPeralatan, 'id' | 'created_at' | 'updated_at'>) => {
    const { tipe_nama, jenis_nama, ...dbData } = data;
    const now = new Date().toISOString();
    return insertMaster(
      'unit_peralatan',
      { ...dbData, id: crypto.randomUUID(), created_at: now, updated_at: now },
      'Unit Peralatan Ditambah',
      data.serial_number || 'Unit Baru'
    );
  };

  const updateUnitStatus = async (id: string, status: UnitPeralatan['status']) => {
    const supabase = requireClient();
    if (!supabase) return;
    const { error } = await supabase
      .from('unit_peralatan')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      showToast('Gagal Update Status', error.message, 'error');
    } else {
      showToast('Status Unit Diperbarui', `Status diubah ke ${status}`, 'success');
      await refreshData();
    }
  };

  const addPersonel = (data: Omit<Personel, 'id' | 'created_at'>) => {
    const { unit_nama, ...dbData } = data;
    return insertMaster(
      'personel',
      { ...dbData, id: crypto.randomUUID(), created_at: new Date().toISOString() },
      'Personel Ditambah',
      data.nama
    );
  };

  const addJadwalShift = (data: Omit<JadwalShift, 'id' | 'created_at'>) => {
    const { personel_nama, ...dbData } = data;
    return insertMaster(
      'jadwal_shift',
      { ...dbData, id: crypto.randomUUID(), created_at: new Date().toISOString() },
      'Jadwal Shift Ditambah',
      `${data.shift} - ${data.tanggal}`
    );
  };

  // --- Spareparts ---

  /** Maps form input to the columns that exist in the `spareparts` table. */
  const toSparepartRow = (input: SparepartFormInput) => ({
    sku: input.sku.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    unit: input.unit?.trim().toUpperCase() || 'UNIT',
    lokasi: input.lokasi?.trim() || null,
    rack: input.rack?.trim() || null
  });

  /** Makes sparepart_compatibility match the selected tipe list exactly. */
  const syncCompatibility = async (
    supabase: SupabaseClient,
    sparepartId: string,
    tipeIds: string[]
  ): Promise<string | null> => {
    const uniqueIds = Array.from(new Set(tipeIds.filter(Boolean)));

    let deleteQuery = supabase.from('sparepart_compatibility').delete().eq('sparepart_id', sparepartId);
    if (uniqueIds.length > 0) {
      deleteQuery = deleteQuery.not('id_tipe', 'in', `(${uniqueIds.join(',')})`);
    }
    const { error: delErr } = await deleteQuery;
    if (delErr) return delErr.message;

    if (uniqueIds.length === 0) return null;

    const { error: upsertErr } = await supabase.from('sparepart_compatibility').upsert(
      // is_primary is left out: there is no primary tipe any more (existing values stay as they are)
      uniqueIds.map((idTipe) => ({
        sparepart_id: sparepartId,
        id_tipe: idTipe
      })),
      { onConflict: 'sparepart_id,id_tipe' }
    );
    return upsertErr ? upsertErr.message : null;
  };

  const addSparepart = async (input: NewSparepartInput): Promise<boolean> => {
    const supabase = requireClient();
    if (!supabase) return false;

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('spareparts')
      .insert([{ ...toSparepartRow(input), id: newId, created_at: now, updated_at: now }]);
    if (error) {
      showToast('Gagal Simpan Sparepart', error.message, 'error');
      return false;
    }

    const problems: string[] = [];

    const compatErr = await syncCompatibility(supabase, newId, input.tipeIds);
    if (compatErr) problems.push(`kompatibilitas: ${compatErr}`);

    // Initial stock is recorded as mutations, because stock is derived from stock_mutations
    const initialMutations = [
      input.stok_awal_baru > 0 && {
        id: crypto.randomUUID(),
        sparepart_id: newId,
        mutation_type: 'Masuk',
        stok_asal: null,
        stok_tujuan: 'baru',
        sumber: 'VENDOR',
        qty: input.stok_awal_baru,
        notes: 'Stok awal pendaftaran sparepart baru',
        created_at: now
      },
      input.stok_awal_bekas > 0 && {
        id: crypto.randomUUID(),
        sparepart_id: newId,
        mutation_type: 'Masuk',
        stok_asal: null,
        stok_tujuan: 'bekas',
        sumber: null,
        qty: input.stok_awal_bekas,
        notes: 'Stok awal bekas pendaftaran sparepart baru',
        created_at: now
      }
    ].filter(Boolean);

    if (initialMutations.length > 0) {
      const { error: mutErr } = await supabase.from('stock_mutations').insert(initialMutations);
      if (mutErr) problems.push(`stok awal: ${mutErr.message}`);
    }

    if (problems.length > 0) {
      showToast('Sparepart Tersimpan Sebagian', `${input.name} tersimpan, tetapi gagal menyimpan ${problems.join('; ')}`, 'warning');
    } else {
      showToast('Sparepart Ditambahkan', `${input.name} tersimpan di Supabase`, 'success');
    }
    await refreshData();
    return true;
  };

  const updateSparepart = async (id: string, input: SparepartFormInput): Promise<boolean> => {
    const supabase = requireClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from('spareparts')
      .update({ ...toSparepartRow(input), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      showToast('Gagal Update Sparepart', error.message, 'error');
      return false;
    }

    const compatErr = await syncCompatibility(supabase, id, input.tipeIds);
    if (compatErr) {
      showToast('Kompatibilitas Gagal Disimpan', compatErr, 'warning');
    } else {
      showToast('Berhasil Diperbarui', 'Data sparepart diperbarui di Supabase', 'success');
    }
    await refreshData();
    return true;
  };

  const deleteSparepart = async (id: string): Promise<boolean> => {
    const supabase = requireClient();
    if (!supabase) return false;
    const target = spareparts.find((s) => s.id === id);
    // stock_mutations & sparepart_compatibility rows are removed by ON DELETE CASCADE
    const { error } = await supabase.from('spareparts').delete().eq('id', id);

    if (error) {
      showToast('Gagal Hapus Sparepart', error.message, 'error');
      return false;
    }
    showToast('Sparepart Dihapus', `${target?.name || id} beserta riwayat mutasinya telah dihapus`, 'info');
    await refreshData();
    return true;
  };

  // --- Stock mutations ---

  const addMutations: InventoryContextType['addMutations'] = async (input) => {
    const supabase = requireClient();
    if (!supabase) return false;

    const type = input.mutation_type;
    if (input.lines.length === 0) {
      showToast('Daftar Kosong', 'Tambahkan minimal satu sparepart.', 'error');
      return false;
    }

    const lines: Array<MutationLineInput & { part: Sparepart }> = [];
    for (const [idx, line] of input.lines.entries()) {
      const part = spareparts.find((s) => s.id === line.sparepart_id);
      if (!part) {
        showToast('Gagal Transaksi', `Baris ${idx + 1}: sparepart belum dipilih atau tidak ditemukan.`, 'error');
        return false;
      }
      const qty = Math.floor(Number(line.qty));
      if (!Number.isFinite(qty) || qty <= 0) {
        showToast('Jumlah Tidak Valid', `Baris ${idx + 1} (${part.sku}): jumlah harus lebih dari 0.`, 'error');
        return false;
      }
      lines.push({ ...line, qty, part });
    }

    if (requiresEquipmentUnit(type) && !input.unit_id) {
      showToast('Unit Wajib Dipilih', 'Transaksi Pakai harus mencatat unit peralatan tempat sparepart dipasang.', 'error');
      return false;
    }

    // Validate every sparepart against the latest stock in the database, all lines combined
    const partIds = Array.from(new Set(lines.map((l) => l.part.id)));
    const { data: currentMuts, error: readErr } = await fetchMutationsOf(supabase, partIds);
    if (readErr) {
      showToast('Gagal Membaca Stok', readErr.message, 'error');
      return false;
    }
    const newRows: StockRow[] = lines.map((l, idx) => ({
      id: `new-${idx}`,
      sparepart_id: l.part.id,
      mutation_type: type,
      qty: l.qty,
      stok_asal: l.flow.asal,
      stok_tujuan: l.flow.tujuan
    }));
    const stockErrors = partIds
      .map((id) => {
        const err = validateStock([...currentMuts, ...newRows], id);
        return err ? `${lines.find((l) => l.part.id === id)?.part.sku}: ${err}` : null;
      })
      .filter(Boolean);
    if (stockErrors.length > 0) {
      showToast('Stok Tidak Cukup', `${stockErrors.join(' | ')} Tidak ada baris yang disimpan.`, 'error');
      return false;
    }

    let finalNotes = input.notes?.trim() || '';
    if (input.reference_no?.trim()) {
      finalNotes = `[Ref: ${input.reference_no.trim()}] ${finalNotes}`.trim();
    }
    if (!input.personel_id && input.petugas_manual?.trim()) {
      finalNotes = withManualPetugas(finalNotes, input.petugas_manual);
    }
    const now = new Date().toISOString();

    const rows = lines.map((l) => ({
      id: crypto.randomUUID(),
      sparepart_id: l.part.id,
      // Pakai: the unit the parts go into · Masuk bekas/rusak: the unit they came out of
      unit_id:
        type === 'Pakai'
          ? input.unit_id || null
          : type === 'Masuk' && l.flow.tujuan !== 'baru'
            ? l.unit_id || null
            : null,
      personel_id: input.personel_id || null,
      mutation_type: type,
      ...flowColumns(type, l.flow, input.penerima, input.unit_penerima),
      // Sumber (asal barang) only applies to Masuk: baru always has one, bekas/rusak optionally
      sumber: type !== 'Masuk' ? null : l.flow.tujuan === 'baru' ? input.sumber || 'VENDOR' : l.sumber || null,
      qty: l.qty,
      notes: finalNotes || null,
      created_at: now
    }));

    // One request: PostgREST inserts all rows in a single statement, so it is all or nothing
    const { error: mutErr } = await supabase.from('stock_mutations').insert(rows);
    if (mutErr) {
      showToast('Gagal Transaksi Supabase', `${mutErr.message} Tidak ada baris yang disimpan.`, 'error');
      return false;
    }

    showToast(
      'Transaksi Berhasil',
      lines.length === 1 ? `Stok ${lines[0].part.name} diperbarui` : `${lines.length} baris sparepart tersimpan`,
      'success'
    );
    await refreshData();
    return true;
  };

  const updateMutation = async (id: string, data: MutationUpdateInput): Promise<boolean> => {
    const supabase = requireClient();
    if (!supabase) return false;

    const original = mutations.find((m) => m.id === id);
    if (!original) {
      showToast('Gagal Edit Transaksi', 'Data mutasi tidak ditemukan. Muat ulang halaman.', 'error');
      return false;
    }

    const qty = Math.floor(Number(data.qty));
    if (!Number.isFinite(qty) || qty <= 0) {
      showToast('Jumlah Tidak Valid', 'Jumlah mutasi harus lebih dari 0.', 'error');
      return false;
    }

    if (requiresEquipmentUnit(data.mutation_type) && !data.unit_id) {
      showToast('Unit Wajib Dipilih', 'Transaksi Pakai harus mencatat unit peralatan tempat sparepart dipasang.', 'error');
      return false;
    }

    const { data: currentMuts, error: readErr } = await fetchSparepartMutations(supabase, original.sparepart_id);
    if (readErr) {
      showToast('Gagal Membaca Stok', readErr.message, 'error');
      return false;
    }
    const stockError = validateStock(
      currentMuts.map((m) =>
        m.id === id
          ? { ...m, mutation_type: data.mutation_type, qty, stok_asal: data.flow.asal, stok_tujuan: data.flow.tujuan }
          : m
      ),
      original.sparepart_id
    );
    if (stockError) {
      showToast('Perubahan Ditolak', stockError, 'error');
      return false;
    }

    const { error } = await supabase
      .from('stock_mutations')
      .update({
        mutation_type: data.mutation_type,
        ...flowColumns(data.mutation_type, data.flow, data.penerima, data.unit_penerima),
        sumber:
          data.mutation_type !== 'Masuk' ? null : data.flow.tujuan === 'baru' ? data.sumber || 'VENDOR' : data.sumber || null,
        qty,
        personel_id: data.personel_id || null,
        unit_id: data.unit_id || null,
        notes: data.notes || null
      })
      .eq('id', id);

    if (error) {
      showToast('Gagal Edit Transaksi', error.message, 'error');
      return false;
    }

    showToast('Transaksi Diperbarui', 'Data riwayat mutasi berhasil diperbarui.', 'success');
    await refreshData();
    return true;
  };

  const deleteMutation = async (id: string): Promise<boolean> => {
    const supabase = requireClient();
    if (!supabase) return false;

    const original = mutations.find((m) => m.id === id);
    if (original) {
      const { data: currentMuts, error: readErr } = await fetchSparepartMutations(supabase, original.sparepart_id);
      if (readErr) {
        showToast('Gagal Membaca Stok', readErr.message, 'error');
        return false;
      }
      const stockError = validateStock(
        currentMuts.filter((m) => m.id !== id),
        original.sparepart_id
      );
      if (stockError) {
        showToast('Hapus Ditolak', `${stockError} Stok tersebut sudah dipakai oleh transaksi lain.`, 'error');
        return false;
      }
    }

    const { error } = await supabase.from('stock_mutations').delete().eq('id', id);

    if (error) {
      showToast('Gagal Hapus Transaksi', error.message, 'error');
      return false;
    }

    showToast('Transaksi Dihapus', 'Data riwayat mutasi berhasil dihapus.', 'info');
    await refreshData();
    return true;
  };

  // --- Calculations ---

  // Recomputed when data changes; "now" is taken at that moment (refreshData updates it)
  const predictive = useMemo(
    () => buildPredictiveReport(spareparts, mutations, unitPeralatanList, Date.now()),
    [spareparts, mutations, unitPeralatanList]
  );

  return (
    <InventoryContext.Provider
      value={{
        jenisPeralatan,
        tipePeralatan,
        lokasiList,
        titikLokasiList,
        unitPeralatanList,
        penempatanList,
        unitKerjaList,
        personelList,
        jadwalShiftList,
        masterConfigs,
        spareparts,
        mutations,
        sparepartCompatibility,
        isLoading,
        isSupabaseConnected,
        addJenisPeralatan,
        addTipePeralatan,
        addLokasi,
        addTitikLokasi,
        addUnitPeralatan,
        updateUnitStatus,
        addPersonel,
        addJadwalShift,
        addSparepart,
        updateSparepart,
        deleteSparepart,
        addMutations,
        updateMutation,
        deleteMutation,
        predictive,
        refreshData
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

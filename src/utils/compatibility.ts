import {
  Sparepart,
  SparepartCompatibility,
  Lokasi,
  TitikLokasi,
  UnitPeralatan,
  PenempatanPeralatan
} from '../types';

interface CompatibilityInput {
  part: Sparepart | undefined | null;
  sparepartCompatibility: SparepartCompatibility[];
  lokasiList: Lokasi[];
  titikLokasiList: TitikLokasi[];
  unitPeralatanList: UnitPeralatan[];
  penempatanList: PenempatanPeralatan[];
  selectedLokasiId: string;
  selectedTitikId: string;
}

/**
 * Resolves which locations, titik and equipment units are compatible with a sparepart,
 * using the primary id_tipe + sparepart_compatibility rows and active penempatan records.
 */
export const getCompatibleEquipment = ({
  part,
  sparepartCompatibility,
  lokasiList,
  titikLokasiList,
  unitPeralatanList,
  penempatanList,
  selectedLokasiId,
  selectedTitikId
}: CompatibilityInput) => {
  const compatTypeIds: string[] = part
    ? Array.from(
        new Set([
          part.id_tipe || '',
          ...sparepartCompatibility.filter((c) => c.sparepart_id === part.id).map((c) => c.id_tipe)
        ])
      ).filter(Boolean)
    : [];

  const activePenempatanByUnit = new Map(
    penempatanList.filter((p) => p.is_active && p.id_unit).map((p) => [p.id_unit as string, p])
  );

  const compatUnits = unitPeralatanList.filter((u) => compatTypeIds.includes(u.id_tipe));

  const compatLokasiIds = new Set<string>();
  penempatanList.forEach((pen) => {
    if (!pen.is_active || !pen.id_lokasi) return;
    const unitTipe = pen.id_unit ? unitPeralatanList.find((u) => u.id === pen.id_unit)?.id_tipe : undefined;
    if (compatTypeIds.includes(pen.id_tipe || '') || (unitTipe && compatTypeIds.includes(unitTipe))) {
      compatLokasiIds.add(pen.id_lokasi);
    }
  });

  const compatibleLokasiList = lokasiList.filter((lok) => compatLokasiIds.has(lok.id));
  const otherLokasiList = lokasiList.filter((lok) => !compatLokasiIds.has(lok.id));

  const availableTitikList = selectedLokasiId
    ? titikLokasiList.filter((t) => t.id_lokasi === selectedLokasiId)
    : [];

  const availableUnits = compatUnits.filter((unit) => {
    if (!selectedLokasiId) return true;
    const pen = activePenempatanByUnit.get(unit.id);
    if (!pen || pen.id_lokasi !== selectedLokasiId) return false;
    if (selectedTitikId && pen.id_titik !== selectedTitikId) return false;
    return true;
  });

  return { compatTypeIds, compatibleLokasiList, otherLokasiList, availableTitikList, availableUnits };
};

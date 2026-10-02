import {
  MutationType,
  Sparepart,
  SparepartCompatibility,
  Lokasi,
  TitikLokasi,
  UnitPeralatan,
  PenempatanPeralatan
} from '../types';

/** Types where a part goes into or comes out of a machine, so a unit can be chosen. */
export const usesEquipmentUnit = (type: MutationType) => type === 'Pakai' || type === 'Bekas' || type === 'Rusak';

/** 'Pakai' must name the unit it is installed in (predictive maintenance per unit). */
export const requiresEquipmentUnit = (type: MutationType) => type === 'Pakai';

interface CompatibilityInput {
  /** Spareparts of the transaction; a unit is compatible when it fits all of them */
  parts: Array<Sparepart | undefined | null>;
  sparepartCompatibility: SparepartCompatibility[];
  lokasiList: Lokasi[];
  titikLokasiList: TitikLokasi[];
  unitPeralatanList: UnitPeralatan[];
  penempatanList: PenempatanPeralatan[];
  selectedLokasiId: string;
  selectedTitikId: string;
}

/**
 * Resolves which locations, titik and equipment units are compatible with the given spareparts
 * (intersection: a unit must fit every part), using the sparepart_compatibility rows (the only
 * sparepart ↔ tipe link) and active penempatan records.
 */
export const getCompatibleEquipment = ({
  parts,
  sparepartCompatibility,
  lokasiList,
  titikLokasiList,
  unitPeralatanList,
  penempatanList,
  selectedLokasiId,
  selectedTitikId
}: CompatibilityInput) => {
  const chosen = parts.filter((p): p is Sparepart => Boolean(p));
  const tipeSetOf = (part: Sparepart) =>
    new Set(sparepartCompatibility.filter((c) => c.sparepart_id === part.id).map((c) => c.id_tipe).filter(Boolean));
  const compatTypeIds: string[] =
    chosen.length === 0
      ? []
      : chosen.slice(1).reduce<string[]>((acc, part) => {
          const set = tipeSetOf(part);
          return acc.filter((id) => set.has(id));
        }, Array.from(tipeSetOf(chosen[0])));

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

  const matchesSelectedPlace = (unit: UnitPeralatan) => {
    if (!selectedLokasiId) return true;
    const pen = activePenempatanByUnit.get(unit.id);
    if (!pen || pen.id_lokasi !== selectedLokasiId) return false;
    if (selectedTitikId && pen.id_titik !== selectedTitikId) return false;
    return true;
  };

  const availableUnits = compatUnits.filter(matchesSelectedPlace);
  // Non-compatible units stay selectable so 'Pakai' is not blocked by incomplete compatibility data
  const otherUnits = unitPeralatanList.filter((u) => !compatTypeIds.includes(u.id_tipe) && matchesSelectedPlace(u));

  return { compatTypeIds, compatibleLokasiList, otherLokasiList, availableTitikList, availableUnits, otherUnits };
};

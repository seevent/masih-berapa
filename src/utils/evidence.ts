/** Photos per transaction. Keeps the Cloudinary free plan (storage, bandwidth) in check. */
export const MAX_EVIDENCE = 5;

/** Compression applied in the browser before upload. */
export const COMPRESS_MAX_SIDE = 1600;
export const COMPRESS_QUALITY = 0.78;
export const COMPRESS_MAX_BYTES = 600 * 1024;

/** Target size of an image: scaled down to fit `maxSide` on its longest side, never scaled up. */
export const fitWithin = (width: number, height: number, maxSide: number): { width: number; height: number } => {
  const longest = Math.max(width, height);
  if (!(longest > 0)) return { width: 0, height: 0 };
  const scale = Math.min(1, maxSide / longest);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

/**
 * Inserts a Cloudinary transformation into a delivery URL
 * (".../upload/v123/x.jpg" → ".../upload/<t>/v123/x.jpg"). Other URLs come back unchanged.
 */
export const cloudinaryTransform = (url: string, transformation: string): string =>
  url.includes('/upload/') ? url.replace('/upload/', `/upload/${transformation}/`) : url;

/** Square thumbnail for lists. */
export const thumbUrl = (url: string, size = 160): string =>
  cloudinaryTransform(url, `c_fill,w_${size},h_${size},q_auto,f_auto`);

/** Large view (still capped), auto format and quality. */
export const viewUrl = (url: string): string => cloudinaryTransform(url, `c_limit,w_${COMPRESS_MAX_SIDE},q_auto,f_auto`);

/** Keeps only non-empty strings, without duplicates, at most MAX_EVIDENCE. */
export const cleanEvidenceUrls = (urls: Array<string | null | undefined> | null | undefined): string[] =>
  Array.from(new Set((urls || []).map((u) => (u || '').trim()).filter(Boolean))).slice(0, MAX_EVIDENCE);

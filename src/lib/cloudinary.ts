import {
  COMPRESS_MAX_BYTES,
  COMPRESS_MAX_SIDE,
  COMPRESS_QUALITY,
  fitWithin
} from '../utils/evidence';

/** Unsigned upload: only the cloud name and a preset are public. No API secret in the browser. */
const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined)?.trim();
const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined)?.trim();

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

const loadImage = (file: Blob): Promise<ImageBitmap | HTMLImageElement> =>
  createImageBitmap(file, { imageOrientation: 'from-image' }).catch(
    () =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        // Older browsers: <img> applies the EXIF orientation by itself
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Foto tidak bisa dibaca'));
        };
        img.src = objectUrl;
      })
  );

const toBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Foto gagal dikompres'))), 'image/jpeg', quality)
  );

/**
 * Shrinks a photo before upload: longest side ≤ COMPRESS_MAX_SIDE, JPEG, quality lowered step by
 * step until it is ≤ COMPRESS_MAX_BYTES. A phone photo of several MB ends up at a few hundred kB.
 */
export const compressImage = async (file: File): Promise<Blob> => {
  if (!file.type.startsWith('image/')) throw new Error('File bukan gambar');
  const source = await loadImage(file);
  const srcW = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const srcH = 'naturalHeight' in source ? source.naturalHeight : source.height;
  const { width, height } = fitWithin(srcW, srcH, COMPRESS_MAX_SIDE);
  if (!width || !height) throw new Error('Foto tidak bisa dibaca');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Foto gagal dikompres');
  ctx.fillStyle = '#ffffff'; // JPEG has no transparency
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  if ('close' in source) source.close();

  let quality = COMPRESS_QUALITY;
  let blob = await toBlob(canvas, quality);
  while (blob.size > COMPRESS_MAX_BYTES && quality > 0.5) {
    quality = Math.round((quality - 0.1) * 100) / 100;
    blob = await toBlob(canvas, quality);
  }
  return blob;
};

/** Uploads one (already compressed) photo; returns its HTTPS delivery URL. */
export const uploadEvidence = async (blob: Blob, name: string): Promise<string> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary belum dikonfigurasi (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET)');
  }
  const form = new FormData();
  form.append('file', blob, name.replace(/\.[^.]+$/, '') + '.jpg');
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('tags', 'masih-berapa,evidence');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.secure_url) {
    throw new Error(body?.error?.message || `Unggah gagal (${res.status})`);
  }
  return body.secure_url as string;
};

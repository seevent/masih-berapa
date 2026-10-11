import React, { useEffect, useRef } from 'react';
import { AlertCircle, Camera, Loader2, RotateCw, X } from 'lucide-react';
import { compressImage, isCloudinaryConfigured, uploadEvidence } from '../../lib/cloudinary';
import { MAX_EVIDENCE, thumbUrl } from '../../utils/evidence';

/** One photo of the form: compressed in the browser, uploaded to Cloudinary right after it is picked. */
export interface EvidenceItem {
  id: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  /** Cloudinary URL once uploaded (or the saved URL of an existing photo) */
  url?: string;
  /** Local preview while the photo is not on Cloudinary yet */
  previewUrl?: string;
  /** Compressed photo kept for a retry after a failed upload */
  blob?: Blob;
  error?: string;
}

/** Items of photos that are already saved (edit form). */
export const evidenceItemsFromUrls = (urls: string[] | null | undefined): EvidenceItem[] =>
  (urls || []).map((url) => ({ id: crypto.randomUUID(), name: 'foto', status: 'done' as const, url }));

export const evidenceUrlsOf = (items: EvidenceItem[]): string[] =>
  items.filter((i) => i.status === 'done' && i.url).map((i) => i.url as string);

export const evidenceIsBusy = (items: EvidenceItem[]): boolean => items.some((i) => i.status === 'uploading');
export const evidenceHasError = (items: EvidenceItem[]): boolean => items.some((i) => i.status === 'error');

interface EvidenceUploaderProps {
  items: EvidenceItem[];
  setItems: React.Dispatch<React.SetStateAction<EvidenceItem[]>>;
  /** Marks the section as mandatory */
  required?: boolean;
  disabled?: boolean;
}

/**
 * Photo evidence of a transaction: several photos, one by one. Each photo is shrunk in the browser
 * (longest side 1600 px, JPEG) and uploaded to Cloudinary with an unsigned preset.
 */
export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ items, setItems, required, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useRef<Set<string>>(new Set());

  // Free the local previews when the form goes away
  useEffect(() => {
    const set = previews.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patch = (id: string, change: Partial<EvidenceItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...change } : i)));

  const upload = async (id: string, blob: Blob, name: string) => {
    try {
      const url = await uploadEvidence(blob, name);
      patch(id, { status: 'done', url, blob: undefined, error: undefined });
    } catch (err: any) {
      patch(id, { status: 'error', blob, error: err?.message || 'Unggah gagal' });
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_EVIDENCE - items.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    for (const file of picked) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      previews.current.add(previewUrl);
      setItems((prev) => [...prev, { id, name: file.name, status: 'uploading', previewUrl }]);
      try {
        const blob = await compressImage(file);
        void upload(id, blob, file.name);
      } catch (err: any) {
        patch(id, { status: 'error', error: err?.message || 'Foto gagal diproses' });
      }
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const retry = (item: EvidenceItem) => {
    if (!item.blob) return;
    patch(item.id, { status: 'uploading', error: undefined });
    void upload(item.id, item.blob, item.name);
  };

  const remove = (item: EvidenceItem) => {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
      previews.current.delete(item.previewUrl);
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const full = items.length >= MAX_EVIDENCE;

  return (
    <div className="space-y-3">
      {!isCloudinaryConfigured && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Penyimpanan foto (Cloudinary) belum dikonfigurasi di aplikasi ini.</span>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {items.map((item) => {
          const src = item.previewUrl || (item.url ? thumbUrl(item.url, 240) : undefined);
          return (
            <div
              key={item.id}
              className={`relative aspect-square rounded-xl overflow-hidden border bg-slate-900 ${
                item.status === 'error' ? 'border-rose-500/60' : 'border-slate-700'
              }`}
            >
              {src && <img src={src} alt={item.name} className="w-full h-full object-cover" />}
              {item.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 text-[10px] text-slate-200">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mengunggah…
                </div>
              )}
              {item.status === 'error' && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 p-1 text-center">
                  <span className="text-[10px] text-rose-300 leading-tight line-clamp-2">{item.error}</span>
                  {item.blob && (
                    <button
                      type="button"
                      onClick={() => retry(item)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-cyan-300"
                    >
                      <RotateCw className="w-3 h-3" /> Ulangi
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(item)}
                disabled={disabled}
                title="Hapus foto"
                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-slate-200 hover:text-white hover:bg-rose-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || !isCloudinaryConfigured}
            className="aspect-square rounded-xl border border-dashed border-slate-600 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Camera className="w-5 h-5" />
            Tambah foto
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void addFiles(e.target.files)}
      />

      <p className="text-[11px] text-slate-500">
        {items.length}/{MAX_EVIDENCE} foto. Tiap foto dikompres otomatis sebelum diunggah.
        {required && items.length === 0 && <span className="text-amber-400"> Minimal 1 foto wajib.</span>}
      </p>
    </div>
  );
};

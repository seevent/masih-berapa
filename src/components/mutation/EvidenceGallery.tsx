import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { thumbUrl, viewUrl } from '../../utils/evidence';

interface EvidenceGalleryProps {
  urls: string[] | null | undefined;
  /** How many thumbnails to show before "+N" */
  maxThumbs?: number;
}

/** Thumbnails of the evidence photos of a transaction; click opens the photos one by one. */
export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({ urls, maxThumbs = 3 }) => {
  const list = urls || [];
  const [openAt, setOpenAt] = useState<number | null>(null);

  useEffect(() => {
    if (openAt === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenAt(null);
      if (e.key === 'ArrowRight') setOpenAt((i) => (i === null ? i : (i + 1) % list.length));
      if (e.key === 'ArrowLeft') setOpenAt((i) => (i === null ? i : (i - 1 + list.length) % list.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openAt, list.length]);

  if (list.length === 0) return <span className="text-slate-500">-</span>;

  const shown = list.slice(0, maxThumbs);
  const extra = list.length - shown.length;

  return (
    <>
      <div className="flex items-center gap-1.5">
        {shown.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenAt(i)}
            title="Lihat foto"
            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-500 shrink-0"
          >
            <img src={thumbUrl(url, 80)} alt={`Evidence ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
          </button>
        ))}
        {extra > 0 && (
          <button
            type="button"
            onClick={() => setOpenAt(maxThumbs)}
            className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-900 text-[11px] font-bold text-slate-300 hover:border-cyan-500"
          >
            +{extra}
          </button>
        )}
      </div>

      {openAt !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpenAt(null)}
          role="dialog"
          aria-label="Foto evidence"
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewUrl(list[openAt])}
              alt={`Evidence ${openAt + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
              <span>
                Foto {openAt + 1} dari {list.length}
              </span>
              <a
                href={list[openAt]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka asli
              </a>
            </div>
            {list.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setOpenAt((openAt - 1 + list.length) % list.length)}
                  title="Sebelumnya"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpenAt((openAt + 1) % list.length)}
                  title="Berikutnya"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpenAt(null)}
              title="Tutup"
              className="absolute -top-3 -right-3 p-1.5 rounded-full bg-slate-800 text-slate-200 hover:text-white border border-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

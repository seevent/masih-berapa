import { describe, expect, it } from 'vitest';
import { MAX_EVIDENCE, cleanEvidenceUrls, cloudinaryTransform, fitWithin, thumbUrl, viewUrl } from './evidence';

describe('fitWithin', () => {
  it('memperkecil sisi terpanjang ke batas dan menjaga rasio', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('tidak pernah memperbesar', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1600, 1600, 1600)).toEqual({ width: 1600, height: 1600 });
  });

  it('ukuran tidak valid menghasilkan 0, sisi terkecil minimal 1', () => {
    expect(fitWithin(0, 0, 1600)).toEqual({ width: 0, height: 0 });
    expect(fitWithin(10000, 1, 1600)).toEqual({ width: 1600, height: 1 });
  });
});

describe('URL Cloudinary', () => {
  const url = 'https://res.cloudinary.com/wha6e7fj/image/upload/v1700000000/masih-berapa/evidence/abc.jpg';

  it('menyisipkan transformasi setelah /upload/', () => {
    expect(cloudinaryTransform(url, 'w_100')).toBe(
      'https://res.cloudinary.com/wha6e7fj/image/upload/w_100/v1700000000/masih-berapa/evidence/abc.jpg'
    );
  });

  it('URL lain tidak diubah', () => {
    expect(cloudinaryTransform('https://example.com/a.jpg', 'w_100')).toBe('https://example.com/a.jpg');
  });

  it('thumbnail dan tampilan besar memakai q_auto,f_auto', () => {
    expect(thumbUrl(url, 120)).toContain('/upload/c_fill,w_120,h_120,q_auto,f_auto/');
    expect(viewUrl(url)).toContain('/upload/c_limit,w_1600,q_auto,f_auto/');
  });
});

describe('cleanEvidenceUrls', () => {
  it('membuang kosong dan duplikat, memangkas ke batas', () => {
    expect(cleanEvidenceUrls([' a ', '', null, undefined, 'a', 'b'])).toEqual(['a', 'b']);
    expect(cleanEvidenceUrls(['1', '2', '3', '4', '5', '6', '7']).length).toBe(MAX_EVIDENCE);
    expect(cleanEvidenceUrls(null)).toEqual([]);
  });
});

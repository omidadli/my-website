/**
 * Client-side image compression — keeps uploads small so they fit in D1
 * (the free media storage fallback) and load fast on the site.
 * Non-image files and unsupported browsers pass through unchanged.
 */
export const compressImage = (file: File, maxDim = 1600, quality = 0.82): Promise<File> =>
  new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
      resolve(file);
      return;
    }
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // compression didn't help — send original
              return;
            }
            const name = file.name.replace(/\.[^.]+$/, outType === 'image/png' ? '.png' : '.jpg');
            resolve(new File([blob], name, { type: outType, lastModified: Date.now() }));
          },
          outType,
          quality,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    } catch {
      resolve(file);
    }
  });

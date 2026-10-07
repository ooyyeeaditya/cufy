/**
 * Image Upload & Compression Utilities
 * Converts File/Blob objects into permanent, lightweight Base64 Data URLs
 * to ensure images can be synced across devices, saved to Supabase/Cloud DB,
 * and viewed reliably in the Admin Panel without ephemeral blob: URL expiration.
 */

export function fileToCompressedBase64(file, maxWidth = 1200, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    // If it's already a base64 string or http URL, return it
    if (typeof file === 'string') {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = () => {
      const rawResult = reader.result;
      if (typeof rawResult !== 'string') {
        return resolve(null);
      }

      // If it's not an image file (e.g. svg or raw data), resolve directly
      if (!file.type || !file.type.startsWith('image/')) {
        return resolve(rawResult);
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback to raw base64 if canvas processing fails
        resolve(rawResult);
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Resize proportionally if dimensions exceed maxWidth
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(rawResult);
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (canvasErr) {
          console.warn('Canvas compression error, using raw base64:', canvasErr);
          resolve(rawResult);
        }
      };

      img.src = rawResult;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Checks whether an image URL is a dead/ephemeral browser blob URL
 */
export function isEphemeralBlobUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.trim().toLowerCase().startsWith('blob:');
}

/**
 * Centralized Image Processing Utilities
 */

/**
 * Compresses an image base64 data string to specified maximum dimensions and quality.
 * Prevents uploading oversized photos from high-resolution mobile cameras.
 *
 * @param base64Str Input base64 image data string
 * @param maxWidth Max bounding width in pixels (defaults to 800)
 * @param maxHeight Max bounding height in pixels (defaults to 800)
 * @param quality JPEG compression quality between 0 and 1 (defaults to 0.7)
 * @returns Promise resolving to compressed JPEG base64 string
 */
export const compressImage = (
  base64Str: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str) {
      resolve('');
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

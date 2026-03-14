/**
 * Utility function to compress images using Canvas API
 * @param {File} file - The image file to compress
 * @param {number} maxSizeInMB - Target maximum file size in MB
 * @returns {Promise<File|Blob>} - Compressed file or original file if compression fails/not image
 */
export const compressImage = (file, maxSizeInMB = 1) => {
    return new Promise((resolve) => {
        // Only compress image types
        if (!file || !file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const maxSizeBytes = maxSizeInMB * 1024 * 1024;

        // If file is already smaller than target, return it
        if (file.size <= maxSizeBytes) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimensions to help compression without losing too much detail
                // 1920x1080 is usually enough for web viewing
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height *= MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width *= MAX_HEIGHT / height));
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compress = (quality) => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            resolve(file); // Fallback to original
                            return;
                        }

                        // If still too large and quality is above 0.3, keep compressing
                        if (blob.size > maxSizeBytes && quality > 0.3) {
                            compress(quality - 0.1);
                        } else {
                            // Create new file from compressed blob
                            const newFile = new File([blob], file.name, {
                                type: 'image/jpeg', // Always output as jpeg for better compression
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        }
                    }, 'image/jpeg', quality);
                };

                // Start compressing at 0.8 quality
                compress(0.8);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

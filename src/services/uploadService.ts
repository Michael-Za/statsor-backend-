interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileId?: string;
}

interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

class UploadService {
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  private allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  async uploadPlayerPhoto(file: File, playerId: string): Promise<UploadResult> {
    try {
      // Validate file
      const validation = (this as any).validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Process image
      const processedFile = await this.processImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        format: 'jpeg'
      });

      // For demo, convert to base64 and store locally
      const base64 = await this.fileToBase64(processedFile);
      const photoUrl = base64;
      
      // Store in localStorage for demo
      const playerPhotos = JSON.parse(localStorage.getItem('player_photos') || '{}');
      playerPhotos[playerId] = photoUrl;
      localStorage.setItem('player_photos', JSON.stringify(playerPhotos));
      
      return {
        success: true,
        url: photoUrl,
        fileId: `photo_${playerId}_${Date.now()}`
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.'
      };
    }

    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}.`
      };
    }

    return { valid: true };
  }

  private async processImage(file: File, options: ImageProcessingOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      img.onload = () => {
        const { maxWidth = 800, maxHeight = 600, quality = 0.8, format = 'jpeg' } = options;
        
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              });
              resolve(processedFile);
            } else {
              reject(new Error('Image processing failed'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = URL.createObjectURL(file);
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility method for direct base64 conversion (for immediate preview)
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Method to validate and get image dimensions
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

export const uploadService = new UploadService();
export type { UploadResult, ImageProcessingOptions };
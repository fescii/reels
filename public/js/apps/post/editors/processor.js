export default class ImageProcessor {
  constructor() {
    this.maxWidth = 1280; // Maximum width for downscaling
    this.maxHeight = 1280; // Maximum height for downscaling
    this.quality = 0.9; // Default WebP quality
    this.chunkSize = 1024; // Size of each processing chunk
  }

  // Convert an image file to WebP format
  async convertToWebP(file) {
    try {
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file provided');
      }

      const img = await this._loadImage(file);
      const { width, height } = this._calculateDimensions(img, file.size);

      // Use OffscreenCanvas if available for better performance
      const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : document.createElement('canvas');

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not get canvas context');

      // Process the image in chunks if it's large
      if (img.width * img.height > 16777216) { // 4096 x 4096
        await this._processImageInChunks(ctx, img, width, height);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Convert canvas to WebP blob
      const blob = await this._canvasToBlob(canvas);
      const filename = `image_${Date.now()}.webp`;
      return new File([blob], filename, { type: 'image/webp' });
    } catch (error) {
      console.error('Error converting image to WebP:', error);
      throw error;
    }
  }

  // Load an image file into an Image object
  _loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate dimensions for downscaling
  _calculateDimensions(img, fileSize) {
    let width = img.width;
    let height = img.height;

    // Only downscale if the image is larger than 1MB
    if (fileSize > 1024 * 1024) {
      const aspectRatio = width / height;

      if (width > this.maxWidth || height > this.maxHeight) {
        if (aspectRatio > 1) {
          // Landscape image
          width = this.maxWidth;
          height = width / aspectRatio;
        } else {
          // Portrait image
          height = this.maxHeight;
          width = height * aspectRatio;
        }
      }
    }

    return { width, height };
  }

  // Process large images in chunks to avoid blocking the main thread
  async _processImageInChunks(ctx, img, width, height) {
    const sourceWidth = img.width;
    const sourceHeight = img.height;
    const numChunksX = Math.ceil(sourceWidth / this.chunkSize);
    const numChunksY = Math.ceil(sourceHeight / this.chunkSize);

    for (let y = 0; y < numChunksY; y++) {
      for (let x = 0; x < numChunksX; x++) {
        const chunkX = x * this.chunkSize;
        const chunkY = y * this.chunkSize;
        const chunkWidth = Math.min(this.chunkSize, sourceWidth - chunkX);
        const chunkHeight = Math.min(this.chunkSize, sourceHeight - chunkY);

        const targetX = (chunkX / sourceWidth) * width;
        const targetY = (chunkY / sourceHeight) * height;
        const targetWidth = (chunkWidth / sourceWidth) * width;
        const targetHeight = (chunkHeight / sourceHeight) * height;

        ctx.drawImage(
          img,
          chunkX, chunkY, chunkWidth, chunkHeight,
          targetX, targetY, targetWidth, targetHeight
        );

        // Yield control to the browser between chunks
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  // Convert canvas to WebP blob
  _canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (canvas instanceof OffscreenCanvas) {
        canvas.convertToBlob({ type: 'image/webp', quality: this.quality })
          .then(resolve)
          .catch(reject);
      } else {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
          'image/webp',
          this.quality
        );
      }
    });
  }
}
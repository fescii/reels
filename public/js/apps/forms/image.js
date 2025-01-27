class ImageProcessor {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1200;
    this.quality = options.quality || 0.9;
    this.format = options.format || 'image/webp';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
  }

  async processImage(file) {
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            const result = this._resizeAndCrop(img);
            resolve(result);
          } catch (error) {
            reject(new Error(`Image processing failed: ${error.message}`));
          }
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        // Handle memory management for large images
        img.onabort = () => {
          URL.revokeObjectURL(img.src);
          reject(new Error('Image loading aborted'));
        };

        // Set crossOrigin to handle CORS issues
        img.crossOrigin = 'anonymous';
        img.src = event.target.result;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  _resizeAndCrop(img) {
    // Create an offscreen canvas if available for better performance
    const canvas = typeof OffscreenCanvas !== 'undefined' 
      ? new OffscreenCanvas(this.maxSize, this.maxSize)
      : document.createElement('canvas');

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get canvas context');

    const aspectRatio = img.width / img.height;
    const { sourceX, sourceY, sourceWidth, sourceHeight } = this._calculateDimensions(img, aspectRatio);

    // Set canvas dimensions
    canvas.width = this.maxSize;
    canvas.height = this.maxSize;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw image in chunks if it's very large
    if (sourceWidth * sourceHeight > 16777216) { // 4096 x 4096
      return this._processLargeImage(ctx, img, sourceX, sourceY, sourceWidth, sourceHeight);
    }

    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, this.maxSize, this.maxSize);

    return this._createOutputBlob(canvas);
  }

  _calculateDimensions(img, aspectRatio) {
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.width;
    let sourceHeight = img.height;

    if (aspectRatio > 1) {
      sourceX = (img.width - img.height) / 2;
      sourceWidth = img.height;
    } else {
      sourceY = (img.height - img.width) / 2;
      sourceHeight = img.width;
    }

    return { sourceX, sourceY, sourceWidth, sourceHeight };
  }

  async _processLargeImage(ctx, img, sourceX, sourceY, sourceWidth, sourceHeight) {
    const chunkSize = 1024;
    const numChunksX = Math.ceil(sourceWidth / chunkSize);
    const numChunksY = Math.ceil(sourceHeight / chunkSize);

    for (let y = 0; y < numChunksY; y++) {
      for (let x = 0; x < numChunksX; x++) {
        const chunkX = sourceX + (x * chunkSize);
        const chunkY = sourceY + (y * chunkSize);
        const chunkW = Math.min(chunkSize, sourceWidth - (x * chunkSize));
        const chunkH = Math.min(chunkSize, sourceHeight - (y * chunkSize));

        const targetX = (x * chunkSize / sourceWidth) * this.maxSize;
        const targetY = (y * chunkSize / sourceHeight) * this.maxSize;
        const targetW = (chunkW / sourceWidth) * this.maxSize;
        const targetH = (chunkH / sourceHeight) * this.maxSize;

        ctx.drawImage(img, chunkX, chunkY, chunkW, chunkH, targetX, targetY, targetW, targetH);

        // Allow other operations to process between chunks
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return this._createOutputBlob(ctx.canvas);
  }

  _createOutputBlob(canvas) {
    return new Promise((resolve, reject) => {
      try {
        if (canvas instanceof OffscreenCanvas) {
          canvas.convertToBlob({
            type: this.format,
            quality: this.quality
          }).then(blob => {
            resolve({ blob, width: this.maxSize, height: this.maxSize });
          });
        } else {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, width: this.maxSize, height: this.maxSize });
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            this.format,
            this.quality
          );
        }
      } catch (error) {
        reject(new Error(`Blob creation failed: ${error.message}`));
      }
    });
  }
}

export default ImageProcessor;
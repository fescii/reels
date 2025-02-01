export default class APIManager {
  constructor(baseURL = '', defaultTimeout = 9500, cacheVersion = 'v1') {
    this.baseURL = baseURL;
    this.defaultTimeout = defaultTimeout;
    this.pendingRequests = new Map();
    this.cacheName = `api-cache-${cacheVersion}`;

    this.contentTypes = {
      json: 'application/json',
      text: 'text/plain',
      html: 'text/html',
      xml: 'application/xml',
      form: 'application/x-www-form-urlencoded',
      multipart: 'multipart/form-data',
      binary: 'application/octet-stream',
    };

    // Initialize cache
    this.initCache();
  }

  async initCache() {
    if ('caches' in window) {
      // Open or create the cache
      await caches.open(this.cacheName);
    } else {
      console.warn('Cache Storage API is not available in this browser');
    }
  }

  #processHeaders(options = {}) {
    const contentType = options?.content;
    const headers = new Headers();

    if (contentType) {
      headers.set('Content-Type', this.contentTypes[contentType]);
    }

    // If options.headers is an object, iterate over it and set each header
    if (options.headers && typeof options.headers === 'object') {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    return headers;
  }

  #generateCacheKey(url, options = {}) {
    const normalizedOptions = { ...options };
    delete normalizedOptions.signal;
    return new Request(url, {
      ...normalizedOptions,
      method: options.method || 'GET',
    });
  }

  async #storeCacheMetadata(request, data, cacheOptions) {
    const metadata = {
      data,
      createdAt: new Date().toISOString(),
      expiryDate: new Date(Date.now() + (cacheOptions.duration || 300000)).toISOString(),
    };

    // Store metadata in localStorage for quick access
    localStorage.setItem(
      `${this.cacheName}-metadata-${request.url}-${request.method}`,
      JSON.stringify(metadata)
    );

    return metadata;
  }

  async #getCacheMetadata(request) {
    const key = `${this.cacheName}-metadata-${request.url}-${request.method}`;
    const metadata = localStorage.getItem(key);
    return metadata ? JSON.parse(metadata) : null;
  }

  async #removeCacheMetadata(request) {
    const key = `${this.cacheName}-metadata-${request.url}-${request.method}`;
    localStorage.removeItem(key);
  }

  async #handleCache(request, cacheOptions) {
    if (!cacheOptions?.allow || !('caches' in window)) return null;

    const cache = await caches.open(this.cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const metadata = await this.#getCacheMetadata(request);
      if (metadata) {
        const now = new Date();
        const expiryDate = new Date(metadata.expiryDate);

        if (now < expiryDate) {
          return metadata.data;
        }
        // Cache expired, remove it
        await this.#removeFromCache(request);
      }
    }
    return null;
  }

  async #setCacheData(request, data, cacheOptions) {
    if (!cacheOptions?.allow || !('caches' in window)) return;

    const cache = await caches.open(this.cacheName);

    // Store the response in the cache
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${Math.floor((cacheOptions.duration || 300000) / 1000)}`,
      },
    });

    await cache.put(request, response);
    await this.#storeCacheMetadata(request, data, cacheOptions);
  }

  async #removeFromCache(request) {
    if ('caches' in window) {
      const cache = await caches.open(this.cacheName);
      await cache.delete(request);
      await this.#removeCacheMetadata(request);
    }
  }

  async #processResponse(response) {
    const contentType = response.headers.get('Content-Type');

    if (contentType?.includes('application/json')) {
      return response.json();
    } else if (contentType?.includes('text/')) {
      return response.text();
    } else if (contentType?.includes('application/octet-stream')) {
      return response.blob();
    }

    try {
      return await response.json();
    } catch {
      return response.text();
    }
  }

  async #request(url, options = {}, cacheOptions = {}) {
    const fullURL = this.baseURL + url;
    const request = this.#generateCacheKey(fullURL, options);

    // Check cache first - will automatically handle expiry
    const cachedData = await this.#handleCache(request, cacheOptions);
    if (cachedData) return cachedData;

    // Handle concurrent requests
    const pendingKey = `${request.url}-${request.method}`;
    const pendingRequest = this.pendingRequests.get(pendingKey);
    if (pendingRequest) return pendingRequest;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || this.defaultTimeout
    );

    const processedHeaders = this.#processHeaders(options);

    // Handle FormData (for file uploads)
    let body = options.body;
    if (body instanceof FormData) {
      // Do not set Content-Type header for FormData; the browser will handle it
      processedHeaders.delete('Content-Type');
    } else if (body && typeof body === 'object') {
      if (processedHeaders.get('Content-Type') === this.contentTypes.json) {
        body = JSON.stringify(body);
      } else if (processedHeaders.get('Content-Type') === this.contentTypes.form) {
        const formData = new URLSearchParams();
        Object.entries(body).forEach(([key, value]) => {
          formData.append(key, value);
        });
        body = formData;
      }
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch(request.url, {
          method: options.method,
          body,
          headers: processedHeaders,
          signal: controller.signal,
          credentials: 'include',
        });

        const data = await this.#processResponse(response);
        await this.#setCacheData(request, data, cacheOptions);
        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(pendingKey);
      }
    })();

    this.pendingRequests.set(pendingKey, fetchPromise);
    return fetchPromise;
  }

  // HTTP method implementations
  async get(url, options = {}, cacheOptions = {}) {
    return this.#request(url, { ...options, method: 'GET' }, cacheOptions);
  }

  async post(url, options = {}, cacheOptions = {}) {
    return this.#request(url, { ...options, method: 'POST' }, cacheOptions);
  }

  async put(url, options = {}, cacheOptions = {}) {
    return this.#request(url, { ...options, method: 'PUT' }, cacheOptions);
  }

  async patch(url, options = {}, cacheOptions = {}) {
    return this.#request(url, { ...options, method: 'PATCH' }, cacheOptions);
  }

  async delete(url, options = {}, cacheOptions = {}) {
    return this.#request(url, { ...options, method: 'DELETE' }, cacheOptions);
  }

  // File upload method
  async uploadFile(url, file, options = {}) {
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided');
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.post(url, { ...options, body: formData });
  }

  // Cache management methods
  async clearCache(url = null, options = {}) {
    if ('caches' in window) {
      if (url) {
        const request = this.#generateCacheKey(this.baseURL + url, options);
        await this.#removeFromCache(request);
      } else {
        await caches.delete(this.cacheName);
        await this.initCache();
        // Clear all metadata
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(`${this.cacheName}-metadata-`)) {
            localStorage.removeItem(key);
          }
        });
      }
    }
  }

  async getCacheSize() {
    if ('caches' in window) {
      const cache = await caches.open(this.cacheName);
      const keys = await cache.keys();
      return keys.length;
    }
    return 0;
  }

  async getCacheStatus(url, options = {}) {
    if (!('caches' in window)) return null;

    const request = this.#generateCacheKey(this.baseURL + url, options);
    const metadata = await this.#getCacheMetadata(request);

    if (!metadata) return null;

    const now = new Date();
    const expiryDate = new Date(metadata.expiryDate);

    return {
      isValid: now < expiryDate,
      createdAt: new Date(metadata.createdAt),
      expiryDate: expiryDate,
      timeRemaining: expiryDate.getTime() - now.getTime(),
    };
  }

  getContentTypes() {
    return { ...this.contentTypes };
  }
}
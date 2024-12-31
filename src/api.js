export default class APIManager {
  constructor(baseURL = '', defaultTimeout = 9500) {
    this.baseURL = baseURL;
    this.defaultTimeout = defaultTimeout;
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Generate cache key from URL and options
  #generateCacheKey(url, options = {}) {
    const normalizedOptions = { ...options };
    delete normalizedOptions.signal;
    return `${options.method || 'GET'}-${url}-${JSON.stringify(normalizedOptions)}`;
  }

  // Handle caching logic
  #handleCache(cacheKey, cacheOptions) {
    if (!cacheOptions?.allow) return null;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < (cacheOptions.duration || 300000)) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }
    return null;
  }

  // Set cache data
  #setCacheData(cacheKey, data, cacheOptions) {
    if (cacheOptions?.allow) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
  }

  // Base request method with timeout and caching
  async #request(url, options = {}, cacheOptions = {}) {
    const fullURL = this.baseURL + url;
    const cacheKey = this.#generateCacheKey(fullURL, options);

    // Check cache first
    const cachedData = this.#handleCache(cacheKey, cacheOptions);
    if (cachedData) return cachedData;

    // Handle concurrent requests to the same endpoint
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) return pendingRequest;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || this.defaultTimeout
    );

    const fetchPromise = (async () => {
      try {
        const response = await fetch(fullURL, {
          ...options,
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.#setCacheData(cacheKey, data, cacheOptions);
        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, fetchPromise);
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

  // Cache management methods
  clearCache(url = null, options = {}) {
    if (url) {
      const cacheKey = this.#generateCacheKey(this.baseURL + url, options);
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  getCacheSize() {
    return this.cache.size;
  }

  isCached(url, options = {}) {
    const cacheKey = this.#generateCacheKey(this.baseURL + url, options);
    return this.cache.has(cacheKey);
  }
}
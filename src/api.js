export default class APIManager {
  constructor(baseURL = '', defaultTimeout = 9500) {
    this.baseURL = baseURL;
    this.defaultTimeout = defaultTimeout;
    this.cache = new Map();
    this.pendingRequests = new Map();
    
    this.contentTypes = {
      json: 'application/json',
      text: 'text/plain',
      html: 'text/html',
      xml: 'application/xml',
      form: 'application/x-www-form-urlencoded',
      multipart: 'multipart/form-data',
      binary: 'application/octet-stream'
    };
  }

  #processHeaders(options = {}) {
    const headers = { ...options.headers };
    
    if (options.headers?.content) {
      const contentType = options.headers.content;
      delete headers.content;

      if (typeof contentType === 'string' && this.contentTypes[contentType]) {
        headers['Content-Type'] = this.contentTypes[contentType];
      } else if (typeof contentType === 'string') {
        headers['Content-Type'] = contentType;
      }
    }

    return headers;
  }

  #generateCacheKey(url, options = {}) {
    const normalizedOptions = { ...options };
    delete normalizedOptions.signal;
    return `${options.method || 'GET'}-${url}-${JSON.stringify(normalizedOptions)}`;
  }

  #handleCache(cacheKey, cacheOptions) {
    if (!cacheOptions?.allow) return null;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      const now = new Date();
      if (now < cached.expiryDate) {
        return cached.data;
      }
      // Cache expired, remove it
      this.cache.delete(cacheKey);
    }
    return null;
  }

  #setCacheData(cacheKey, data, cacheOptions) {
    if (cacheOptions?.allow) {
      const duration = cacheOptions.duration || 300000; // 5 minutes default
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + duration);
      
      this.cache.set(cacheKey, {
        data,
        expiryDate,
        createdAt: new Date()
      });
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
    const cacheKey = this.#generateCacheKey(fullURL, options);

    // Check cache first - will automatically handle expiry
    const cachedData = this.#handleCache(cacheKey, cacheOptions);
    if (cachedData) return cachedData;

    // Handle concurrent requests
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) return pendingRequest;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || this.defaultTimeout
    );

    const processedHeaders = this.#processHeaders(options);

    const fetchPromise = (async () => {
      try {
        const response = await fetch(fullURL, {
          ...options,
          headers: processedHeaders,
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await this.#processResponse(response);
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

  getCacheStatus(url, options = {}) {
    const cacheKey = this.#generateCacheKey(this.baseURL + url, options);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return null;
    
    const now = new Date();
    return {
      isValid: now < cached.expiryDate,
      createdAt: cached.createdAt,
      expiryDate: cached.expiryDate,
      timeRemaining: cached.expiryDate.getTime() - now.getTime()
    };
  }

  getContentTypes() {
    return { ...this.contentTypes };
  }
}
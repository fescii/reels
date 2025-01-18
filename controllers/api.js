class APIManager {
  constructor(baseURL = '', defaultTimeout = 9500) {
    this.baseURL = baseURL;
    this.defaultTimeout = defaultTimeout;
    this.pendingRequests = new Map();
  }

  #processHeaders(headers = {}) {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers
    };
  }

  async #processResponse(response) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async #request(url, options = {}) {
    const fullURL = this.baseURL + url;
    
    // Handle concurrent requests
    const pendingKey = `${fullURL}-${options.method}`;
    const pendingRequest = this.pendingRequests.get(pendingKey);
    if (pendingRequest) return pendingRequest;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || this.defaultTimeout
    );

    const processedHeaders = this.#processHeaders(options.headers);

    const fetchPromise = (async () => {
      try {
        const response = await fetch(fullURL, {
          ...options,
          headers: processedHeaders,
          signal: controller.signal
        });

        return await this.#processResponse(response);
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
  async get(url, headers = {}) {
    return this.#request(url, { 
      method: 'GET',
      headers
    });
  }

  async post(url, body = {}, headers = {}) {
    return this.#request(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  }

  async put(url, body = {}, headers = {}) {
    return this.#request(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
  }

  async patch(url, body = {}, headers = {}) {
    return this.#request(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });
  }

  async delete(url, headers = {}) {
    return this.#request(url, {
      method: 'DELETE',
      headers
    });
  }
}

module.exports =  new APIManager('http://localhost:3000/api/v1');
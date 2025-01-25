const https = require('https');
const path = require('path');
const fs = require('fs');
class APIManager {
  constructor(baseURL = '', defaultTimeout = 9500) {
    this.baseURL = baseURL;
    this.defaultTimeout = defaultTimeout;
    this.pendingRequests = new Map();
    
    // Create HTTPS agent with proper cert handling
    this.httpsAgentOptions = {
      rejectUnauthorized: true,
      key: fs.readFileSync(path.resolve(__dirname, '../ssl/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../ssl/cert.pem')),
      ca: fs.readFileSync(path.resolve(__dirname, '../ssl/rootCA.pem'))
    };
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

    const requestOptions = {
      // ...options,
      ...this.httpsAgentOptions,
      ...this.#processHeaders(options)
    };

    const requestPromise = new Promise((resolve, reject) => {
      const req = https.request(fullURL, requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 600) {
              resolve(json);
            } else {
              reject(new Error(`HTTP error! status: ${res.statusCode}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });

    this.pendingRequests.set(pendingKey, requestPromise);
    return requestPromise;
  }

  // HTTP method implementations
  async get(url, headers = {}) {
    // check if options contains any null or undefined values and remove them
    Object.keys(headers).forEach(key => headers[key] == null && delete headers[key]);

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

module.exports =  new APIManager('https://localhost/api/v1');
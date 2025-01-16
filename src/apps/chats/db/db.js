export default class IndexDBHandler {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this._isInitialized = false;
  }

  // Check if database is initialized
  get isInitialized() {
    return this._isInitialized && this.db !== null;
  }

  // Initialize the database with error handling
  async init(stores) {
    if (this._isInitialized) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
        };

        request.onblocked = () => {
          reject(new Error('Database opening blocked. Please close other tabs using this app'));
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          this._isInitialized = true;

          // Handle connection errors
          this.db.onerror = (event) => {
            console.error('Database error:', event.target.error);
          };

          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          stores.forEach(({ name, keyPath, indices }) => {
            if (!db.objectStoreNames.contains(name)) {
              const store = db.createObjectStore(name, { keyPath });
              
              if (indices) {
                indices.forEach(({ name: indexName, keyPath: indexKeyPath, options }) => {
                  if (!store.indexNames.contains(indexName)) {
                    store.createIndex(indexName, indexKeyPath, options);
                  }
                });
              }
            }
          });
        };
      } catch (error) {
        reject(new Error(`Database initialization failed: ${error.message}`));
      }
    });
  }

  // Verify database connection
  verifyConnection() {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call init() first.');
    }
  }

  // Create a transaction with error handling
  createTransaction(storeNames, mode = 'readonly') {
    this.verifyConnection();
    const transaction = this.db.transaction(storeNames, mode);
    
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve(transaction);
      
      resolve(transaction);
    });
  }

  // Base operation methods with improved error handling
  async put(storeName, data) {
    try {
      const transaction = await this.createTransaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw new Error(`Put operation failed: ${error.message}`);
    }
  }

  async get(storeName, key) {
    try {
      const transaction = await this.createTransaction(storeName);
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw new Error(`Get operation failed: ${error.message}`);
    }
  }

  async delete(storeName, key) {
    try {
      const transaction = await this.createTransaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw new Error(`Delete operation failed: ${error.message}`);
    }
  }

  async clear(storeName) {
    try {
      const transaction = await this.createTransaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw new Error(`Clear operation failed: ${error.message}`);
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this._isInitialized = false;
    }
  }
}
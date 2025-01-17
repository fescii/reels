export class KeyStorage {
  constructor(sodium) {
    this.sodium = sodium;
    this.dbName = 'secureKeyStore';
    this.storeName = 'keys';
    this.db = null;
    this.memoryKey = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async storeEncryptedKey(userHex, encryptedPrivateKey, keyNonce, memoryCacheEnabled = false) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const keyData = {
        encryptedKey: encryptedPrivateKey,
        nonce: keyNonce
      };

      const request = store.put(keyData, userHex);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (memoryCacheEnabled && this.memoryKey) {
          this.memoryKey = keyData;
        }
        resolve();
      };
    });
  }

  async getPrivateKey(userHex) {
    if (this.memoryKey) return this.memoryKey;
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(userHex);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async removeKey(userHex) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(userHex);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.clearMemoryKey();
        resolve();
      };
    });
  }

  clearMemoryKey() {
    if (this.memoryKey) {
      this.memoryKey = null;
    }
  }
}
import IndexDBHandler from './db.js';

export default class KeyPairStorageManager extends IndexDBHandler {
  constructor() {
    super('keyPairDB', 1);
    this.stores = [
      {
        name: 'keyPairs',
        keyPath: 'userId',
        indices: [
          { 
            name: 'createdAt', 
            keyPath: 'createdAt',
            options: { unique: false }
          }
        ]
      }
    ];
  }

  async initialize() {
    try {
      await this.init(this.stores);
    } catch (error) {
      throw new Error(`KeyPair storage initialization failed: ${error.message}`);
    }
  }

  validateKeyPairData(keyPairData) {
    if (!keyPairData?.userId) {
      throw new Error('KeyPair must have a userId');
    }
    if (!keyPairData?.publicKey) {
      throw new Error('KeyPair must have a publicKey');
    }
    if (!keyPairData?.encryptedPrivateKey) {
      throw new Error('KeyPair must have an encryptedPrivateKey');
    }
  }

  async saveKeyPair(keyPairData) {
    try {
      this.validateKeyPairData(keyPairData);

      // Check if a key pair already exists for this user
      const existingKeyPair = await this.getKeyPair(keyPairData.userId);
      if (existingKeyPair) {
        throw new Error('A key pair already exists for this user');
      }

      // Add creation timestamp
      const dataToStore = {
        ...keyPairData,
        createdAt: new Date().toISOString()
      };

      await this.put('keyPairs', dataToStore);
      return dataToStore;
    } catch (error) {
      throw new Error(`Failed to save key pair: ${error.message}`);
    }
  }

  async getKeyPair(userId) {
    try {
      return await this.get('keyPairs', userId);
    } catch (error) {
      throw new Error(`Failed to get key pair: ${error.message}`);
    }
  }

  async updateKeyPair(keyPairData) {
    try {
      this.validateKeyPairData(keyPairData);

      // Verify the key pair exists before updating
      const existingKeyPair = await this.getKeyPair(keyPairData.userId);
      if (!existingKeyPair) {
        throw new Error('No existing key pair found for this user');
      }

      // Preserve creation timestamp while updating other fields
      const dataToStore = {
        ...keyPairData,
        createdAt: existingKeyPair.createdAt
      };

      await this.put('keyPairs', dataToStore);
      return dataToStore;
    } catch (error) {
      throw new Error(`Failed to update key pair: ${error.message}`);
    }
  }

  async deleteKeyPair(userId) {
    try {
      return await this.delete('keyPairs', userId);
    } catch (error) {
      throw new Error(`Failed to delete key pair: ${error.message}`);
    }
  }

  async hasExistingKeyPair(userId) {
    try {
      const keyPair = await this.getKeyPair(userId);
      return !!keyPair;
    } catch (error) {
      throw new Error(`Failed to check existing key pair: ${error.message}`);
    }
  }
}
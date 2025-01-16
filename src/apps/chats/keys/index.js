const sodium = window.sodium;

import { KeyDerivation } from './derive.js';
// import { KeyStorage } from './store.js';
import { KeyManagement } from './manage.js';
import { MessageEncryption } from './encryption.js';

import KeyPairStorageManager from '../db/key.js';

export default class CryptoManager {
  constructor() {
    this.initialized = false;
    this.sodium = null;
    this.keyDerivation = null;
    this.keyPairStorage = null;
    this.keyManagement = null;
    this.messageEncryption = null;
    this.init = this.init.bind(this);
  }

  async init() {
    if (this.initialized) return;

    await sodium.ready;
    this.sodium = sodium;

    // Initialize all components with sodium instance
    this.keyDerivation = new KeyDerivation(this.sodium);
    this.keyPairStorage = new KeyPairStorageManager();
    this.keyManagement = new KeyManagement(this.sodium, this.keyDerivation);
    this.messageEncryption = new MessageEncryption(this.sodium);

    // Initialize storage
    await this.keyPairStorage.initialize();

    this.initialized = true;
  }

  async setupUserKeys(userId, passcode) {
    await this.#ensureInitialized();

    // Check if user already has a key pair
    const hasExisting = await this.keyPairStorage.hasExistingKeyPair(userId);
    if (hasExisting) {
      // throw new Error('User already has a key pair');

      // Get the existing key pair
      const keyPair = await this.keyPairStorage.getKeyPair(userId);
      return keyPair;
    }

    const keyPair = await this.keyManagement.generateKeyPair();
    const encryptedKeys = await this.keyManagement.encryptPrivateKey(keyPair.privateKey, passcode);

    const keyPairData = {
      userId,
      publicKey: keyPair.publicKey,
      encryptedPrivateKey: encryptedKeys.encryptedPrivateKey,
      privateKeyNonce: encryptedKeys.privateKeyNonce,
      passcodeSalt: encryptedKeys.passcodeSalt
    };

    await this.keyPairStorage.saveKeyPair(keyPairData);
    return keyPairData;
  }

  async encryptMessage(message, recipientPublicKey, userId) {
    await this.#ensureInitialized();

    const keyPair = await this.keyPairStorage.getKeyPair(userId);
    if (!keyPair) {
      throw new Error('No key pair found for this user');
    }

    return this.messageEncryption.encryptMessageForBoth(message, {
      recipientPublicKey,
      senderPublicKey: keyPair.publicKey,
      senderPrivateKey: keyPair.encryptedPrivateKey
    });
  }

  async decryptMessage(encryptedMessage, senderPublicKey, userId) {
    await this.#ensureInitialized();

    const keyPair = await this.keyPairStorage.getKeyPair(userId);
    if (!keyPair) {
      throw new Error('No key pair found for this user');
    }

    return this.messageEncryption.decryptMessage(
      encryptedMessage,
      senderPublicKey,
      keyPair.encryptedPrivateKey
    );
  }

  async logout(userId) {
    await this.#ensureInitialized();
    await this.keyPairStorage.deleteKeyPair(userId);
  }

  async #ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }
}
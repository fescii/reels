const sodium = window.sodium;

import { KeyDerivation } from './derive.js';
import { KeyStorage } from './store.js';
import { KeyManagement } from './manage.js';
import { MessageEncryption } from './encryption.js';

export default class CryptoManager {
  constructor() {
    this.initialized = false;
    this.sodium = null;
    this.keyDerivation = null;
    this.keyStorage = null;
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
    this.keyStorage = new KeyStorage(this.sodium);
    this.keyManagement = new KeyManagement(this.sodium, this.keyDerivation);
    this.messageEncryption = new MessageEncryption(this.sodium);

    // Initialize storage
    await this.keyStorage.init();

    this.initialized = true;
  }

  async setupUserKeys(name, passcode) {
    await this.#ensureInitialized();

    const keyPair = await this.keyManagement.generateKeyPair();
    const encryptedKeys = await this.keyManagement.encryptPrivateKey(keyPair.privateKey, passcode);

    return {
      name,
      publicKey: keyPair.publicKey,
      encryptedPrivateKey: encryptedKeys.encryptedPrivateKey,
      privateKeyNonce: encryptedKeys.privateKeyNonce,
      passcodeSalt: encryptedKeys.passcodeSalt
    };
  }

  async encryptMessage(message, recipientPublicKey, senderPublicKey, userHex) {
    await this.#ensureInitialized();

    const privateKey = await this.keyStorage.getPrivateKey(userHex);
    if (!privateKey) {
      throw new Error('Private key not found in storage');
    }

    return this.messageEncryption.encryptMessageForBoth(message, {
      recipientPublicKey,
      senderPublicKey,
      senderPrivateKey: privateKey.encryptedKey
    });
  }

  async decryptMessage(encryptedMessage, senderPublicKey, userHex) {
    await this.#ensureInitialized();

    const privateKey = await this.keyStorage.getPrivateKey(userHex);
    if (!privateKey) {
      throw new Error('Private key not found in storage');
    }

    return this.messageEncryption.decryptMessage(
      encryptedMessage,
      senderPublicKey,
      privateKey.encryptedKey
    );
  }

  async logout(userHex) {
    await this.#ensureInitialized();
    await this.keyStorage.removeKey(userHex);
  }

  async #ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }
}
export class KeyManagement {
  constructor(sodium, keyDerivation) {
    this.sodium = sodium;
    this.keyDerivation = keyDerivation;
  }

  async generateKeyPair() {
    const keyPair = this.sodium.crypto_box_keypair();
    return {
      publicKey: this.sodium.to_base64(keyPair.publicKey),
      privateKey: this.sodium.to_base64(keyPair.privateKey)
    };
  }

  async generateHexId() {
    const randomBytes = this.sodium.randombytes_buf(16);
    return this.sodium.to_hex(randomBytes);
  }

  async encryptPrivateKey(privateKey, passcode) {
    const { key, salt } = await this.keyDerivation.deriveKeyFromPasscode(passcode);
    const nonce = this.sodium.randombytes_buf(this.sodium.crypto_secretbox_NONCEBYTES);

    const privateKeyBytes = this.sodium.from_base64(privateKey);
    const encryptedPrivateKey = this.sodium.crypto_secretbox_easy(  // Changed from crypto_secretbox to crypto_secretbox_easy
      privateKeyBytes,
      nonce,
      key
    );

    return {
      encryptedPrivateKey: this.sodium.to_base64(encryptedPrivateKey),
      privateKeyNonce: this.sodium.to_base64(nonce),
      passcodeSalt: salt
    };
  }

  static async decryptPrivateKey(encryptedData, passcode) {
    const { encryptedPrivateKey, privateKeyNonce, passcodeSalt } = encryptedData;
    const { key } = await KeyDerivation.deriveKeyFromPasscode(passcode, passcodeSalt);

    const privateKey = this.sodium.crypto_secretbox_open_easy(  // Changed from crypto_secretbox_open to crypto_secretbox_open_easy
      this.sodium.from_base64(encryptedPrivateKey),
      this.sodium.from_base64(privateKeyNonce),
      key
    );

    if (!privateKey) {
      throw new Error("Failed to decrypt private key. Incorrect passcode.");
    }

    return this.sodium.to_base64(privateKey);
  }
}
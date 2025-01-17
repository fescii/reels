export class MessageEncryption {
  constructor(sodium) {
    this.sodium = sodium;
  }

  async encryptMessageForBoth(message, { recipientPublicKey, senderPublicKey, senderPrivateKey }) {
    const recipientNonce = this.sodium.randombytes_buf(this.sodium.crypto_box_NONCEBYTES);
    const senderNonce = this.sodium.randombytes_buf(this.sodium.crypto_box_NONCEBYTES);

    const recipientMessage = this.sodium.crypto_box_easy(
      this.sodium.from_string(message),
      recipientNonce,
      this.sodium.from_base64(recipientPublicKey),
      this.sodium.from_base64(senderPrivateKey)
    );

    const senderMessage = this.sodium.crypto_box_easy(
      this.sodium.from_string(message),
      senderNonce,
      this.sodium.from_base64(senderPublicKey),
      this.sodium.from_base64(senderPrivateKey)
    );

    return {
      forRecipient: {
        encrypted: this.sodium.to_base64(recipientMessage),
        nonce: this.sodium.to_base64(recipientNonce)
      },
      forSender: {
        encrypted: this.sodium.to_base64(senderMessage),
        nonce: this.sodium.to_base64(senderNonce)
      }
    };
  }

  static async decryptMessage(encryptedData, publicKey, privateKey) {
    const { encrypted, nonce } = encryptedData;
    const decrypted = sodium.crypto_box_open_easy(
      this.sodium.from_base64(encrypted),
      this.sodium.from_base64(nonce),
      this.sodium.from_base64(publicKey),
      this.sodium.from_base64(privateKey)
    );

    if (!decrypted) {
      throw new Error("Failed to decrypt message");
    }

    return this.sodium.to_string(decrypted);
  }
}
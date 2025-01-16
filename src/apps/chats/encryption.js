// Import sodium from 'libsodium-wrappers'
const sodium = window.sodium;

class CryptoClient {
  constructor() {
    this.dbName = "secretKeys";
    this.initialized = false;
    this.init();
  }

  async init() {
    if (!this.initialized) {
      await sodium.ready;
      this.initialized = true;
    }
  }

  getDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = function (event) {
        reject("Database error: " + event.target.errorCode);
      };

      request.onsuccess = function (event) {
        resolve(event.target.result);
      };

      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        db.createObjectStore("userKeys", { keyPath: "id" });
        resolve(db);
      };
    });
  }

  async generateHexId() {
    await this.init();
    const randomBytes = sodium.randombytes_buf(16);
    return sodium.to_hex(randomBytes);
  }

  async generateKeyPair() {
    await this.init();
    const keyPair = sodium.crypto_box_keypair();
    return {
      publicKey: sodium.to_base64(keyPair.publicKey),
      privateKey: sodium.to_base64(keyPair.privateKey)
    };
  }

  async deriveKeyFromPasscode(passcode, salt = null) {
    await this.init();
    const saltBytes = salt ? 
      sodium.from_base64(salt) : 
      sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

    const key = sodium.crypto_pwhash(
      sodium.crypto_secretbox_KEYBYTES,
      passcode,
      saltBytes,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_DEFAULT
    );

    return {
      key,
      salt: sodium.to_base64(saltBytes)
    };
  }

  async encryptPrivateKey(privateKey, passcode) {
    await this.init();
    const { key, salt } = await this.deriveKeyFromPasscode(passcode);
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    
    const privateKeyBytes = sodium.from_base64(privateKey);
    const encryptedPrivateKey = sodium.crypto_secretbox(
      privateKeyBytes,
      nonce,
      key
    );

    return {
      encryptedPrivateKey: sodium.to_base64(encryptedPrivateKey),
      privateKeyNonce: sodium.to_base64(nonce),
      passcodeSalt: salt
    };
  }

  async decryptPrivateKey(encryptedData, passcode) {
    await this.init();
    const { encryptedPrivateKey, privateKeyNonce, passcodeSalt } = encryptedData;

    const { key } = await this.deriveKeyFromPasscode(passcode, passcodeSalt);
    
    const privateKey = sodium.crypto_secretbox_open(
      sodium.from_base64(encryptedPrivateKey),
      sodium.from_base64(privateKeyNonce),
      key
    );

    if (!privateKey) {
      throw new Error("Failed to decrypt private key. Incorrect passcode.");
    }

    return sodium.to_base64(privateKey);
  }

  async setupUserKeys(name, passcode) {
    const client = new CryptoClient();
    await client.init();

    // 1. Generate key pair
    const keyPair = await client.generateKeyPair();

    // 2. First generate salt and derive key
    const { key, salt: passcodeSalt } = await client.deriveKeyFromPasscode(passcode);

    // 3. Use this derived key to encrypt private key
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const encryptedPrivateKey = sodium.crypto_secretbox(
      sodium.from_base64(keyPair.privateKey),
      nonce,
      key
    );

    // 4. Send to server
    const response = await api.post('/users/register', {
      name,
      publicKey: keyPair.publicKey,
      encryptedPrivateKey: sodium.to_base64(encryptedPrivateKey),
      privateKeyNonce: sodium.to_base64(nonce),
      passcodeSalt: sodium.to_base64(passcodeSalt)  // Independent salt
    });

    // Clear sensitive data from memory
    key = null;
    keyPair.privateKey = null;

    return response.user;
  }

  // check if key pair exists in the database(indexedDB) before generating a new one
  async checkKeyPair() {
    const db = await this.getDb();

    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction(["userKeys"], "read");
      const store = transaction.objectStore("userKeys");
      const request = store.get("keyPair");

      request.onerror = function (event) {
        reject("Failed to get key pair: " + event.target.errorCode);
      }

      request.onsuccess = async function (event) {
        if (event.target.result) {
          resolve(event.target.result);
        } else {
          try {
            const newKeyPair = await this.storeKeyPair();
            resolve(newKeyPair);
          } catch (error) {
            reject("Failed to store new key pair: " + error);
          }
        }
      }.bind(this);
    });
  }

  // generate a key pair for signing messages and storing in the database(indexedDB)
  async storeKeyPair() {
    const keyPair = await this.generateKeyPair();

    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["userKeys"], "read");
      const store = transaction.objectStore("userKeys");
      const request = store.add({
        id: "keyPair",
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey
      });

      request.onerror = function (event) {
        reject("Failed to store key pair: " + event.target.errorCode);
      }

      request.onsuccess = function (event) {
        resolve(keyPair);
      }
    });
  }

  async getKeyPair() {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["userKeys"], "read");
      const store = transaction.objectStore("userKeys");
      const request = store.get("keyPair");

      request.onerror = function (event) {
        reject("Failed to get key pair: " + event.target.errorCode);
      }

      request.onsuccess = function (event) {
        resolve(event.target.result);
      }
    });
  }

  async deriveKeyFromPasscode(passcode, salt = null) {
    await this.init();
    const saltBytes = salt ?
      sodium.from_base64(salt) :
      sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

    const key = sodium.crypto_pwhash(
      sodium.crypto_secretbox_KEYBYTES,
      passcode,
      saltBytes,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_DEFAULT
    );

    return {
      key,
      salt: sodium.to_base64(saltBytes)
    };
  }

  async encryptMessageForBoth(message, {
    recipientPublicKey,
    senderPublicKey,
    senderPrivateKey
  }) {
    await this.init();

    // Generate a unique nonce for each encryption
    const recipientNonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const senderNonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);

    // Encrypt for recipient
    const recipientMessage = sodium.crypto_box_easy(
      sodium.from_string(message),
      recipientNonce,
      sodium.from_base64(recipientPublicKey),
      sodium.from_base64(senderPrivateKey)
    );

    // Encrypt for sender (using sender's own public key)
    const senderMessage = sodium.crypto_box_easy(
      sodium.from_string(message),
      senderNonce,
      sodium.from_base64(senderPublicKey),
      sodium.from_base64(senderPrivateKey)
    );

    return {
      forRecipient: {
        encrypted: sodium.to_base64(recipientMessage),
        nonce: sodium.to_base64(recipientNonce)
      },
      forSender: {
        encrypted: sodium.to_base64(senderMessage),
        nonce: sodium.to_base64(senderNonce)
      }
    };
  }

  async decryptMessage(encryptedData, publicKey, privateKey) {
    await this.init();

    const { encrypted, nonce } = encryptedData;

    const decrypted = sodium.crypto_box_open_easy(
      sodium.from_base64(encrypted),
      sodium.from_base64(nonce),
      sodium.from_base64(publicKey),
      sodium.from_base64(privateKey)
    );

    if (!decrypted) {
      throw new Error("Failed to decrypt message");
    }

    return sodium.to_string(decrypted);
  }

}

// export the CryptoClient class
export default new CryptoClient();
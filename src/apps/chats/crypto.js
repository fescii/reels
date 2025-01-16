// Usage example:
const crypto = new CryptoManager();
await crypto.init();

// Setup new user
const userKeys = await crypto.setupUserKeys('username', 'userpasscode');

// Send message
const encrypted = await crypto.encryptMessage(
  'Hello!',
  recipientPublicKey,
  senderPublicKey,
  userHex
);

// Decrypt message
const decrypted = await crypto.decryptMessage(
  encryptedMessage,
  senderPublicKey,
  userHex
);

// Logout
await crypto.logout(userHex);

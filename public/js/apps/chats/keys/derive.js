export class KeyDerivation {
  constructor(sodium) {
	this.sodium = sodium;
  }

  async deriveKeyFromPasscode(passcode, existingSalt = null) {
		const saltBytes = existingSalt ? 
		  this.sodium.from_base64(existingSalt) : 
		  this.sodium.randombytes_buf(this.sodium.crypto_pwhash_SALTBYTES);

	  const key = this.sodium.crypto_pwhash(
		  this.sodium.crypto_secretbox_KEYBYTES,
		  passcode,
		  saltBytes,
		  this.sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
		  this.sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
		  this.sodium.crypto_pwhash_ALG_DEFAULT
	  );

	  return {
		  key,
		  salt: this.sodium.to_base64(saltBytes)
	  };
  }
}
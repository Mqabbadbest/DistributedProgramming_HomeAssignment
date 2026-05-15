const crypto = require("crypto");

const ENCRYPTION_KEY = Buffer.from(process.env.CARD_ENCRYPTION_KEY, "base64");
const IV_LENGTH = 16;

const tokenizeCard = (cardData) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(cardData)),
    cipher.final(),
  ]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const detokenizeCard = (token) => {
  const [ivHex, encryptedHex] = token.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString());
};

/**
 * Masks a card number: first 6 visible, last 4 visible, middle masked.
 * e.g. 4111111111111111 → 411111......1111
 */
const maskCardNumber = (cardNumber) => {
  const clean = cardNumber.replace(/\s/g, "");
  const first6 = clean.substring(0, 6);
  const last4 = clean.substring(clean.length - 4);
  return `${first6}......${last4}`;
};

module.exports = { tokenizeCard, detokenizeCard, maskCardNumber };

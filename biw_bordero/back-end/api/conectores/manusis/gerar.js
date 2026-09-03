// gerar_nova_senha.js
import crypto from "crypto";

const ALGO = "aes-256-cbc";
const KEY = Buffer.from(
  "fbb6487d110fb51f24fd34d4529f2c26746d8a37d0ac6cf6b8b34c68a2284dd6",
  "hex",
);

function encryptPassword(password) {
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") };
}

// Coloque a senha que você quer usar
const novaSenha = "Fiat1235@";
const { encrypted, iv } = encryptPassword(novaSenha);

console.log("SQL para atualizar:");
console.log(`UPDATE auth.manusis_credentials 
SET password_encrypted = '${encrypted}',
    iv = '${iv}',
    updated_at = NOW()
WHERE user_email = 'sc49145';`);

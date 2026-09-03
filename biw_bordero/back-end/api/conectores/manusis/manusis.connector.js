import axios from "axios";
import { CookieJar } from "tough-cookie";
import { HttpsProxyAgent } from "https-proxy-agent";
import crypto from "crypto";
import dns from "node:dns";
import { pool } from "../../postgreConnect.js";
import { redisService } from "../redis/redis.service.js";

// --- CONFIGURAÇÃO GLOBAL ---
dns.setDefaultResultOrder("ipv4first");

const ALGO = "aes-256-cbc";
const KEY = Buffer.from(process.env.CRYPT_KEY, "hex");
const BASE_URL = process.env.MANUSIS_BASE_URL;
const CACHE_KEY = "manusis:session";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// --- FUNÇÕES AUXILIARES ---

function decryptPassword(encrypted, ivHex) {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function encryptPassword(password) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") };
}

async function getCredentials() {
  const { rows } = await pool.query(
    `SELECT user_email, password_encrypted, iv
     FROM auth.manusis_credentials
     ORDER BY updated_at DESC
     LIMIT 1`,
  );
  if (!rows.length) throw new Error("Credenciais do Manusis não configuradas");

  const { user_email, password_encrypted, iv } = rows[0];
  const password = decryptPassword(password_encrypted, iv);

  return { email: user_email, password };
}

async function updateCredentials(email, newPassword, newIv) {
  await pool.query(
    `UPDATE auth.manusis_credentials 
     SET password_encrypted = $1, iv = $2, updated_at = NOW()
     WHERE user_email = $3`,
    [newPassword, newIv, email],
  );
}

function getHttpsAgent() {
  const host = process.env.PROXY_HOST?.trim();
  const port = process.env.PROXY_PORT?.trim();
  const user = process.env.PROXY_USER?.trim();
  const pass = process.env.PROXY_PASS?.trim();

  if (!host || !port) {
    console.log("⚠️ Proxy não configurado, usando conexão direta");
    return null;
  }

  const cleanHost = host.replace(/^https?:\/\//, "");
  const auth = `${user}:${encodeURIComponent(pass)}`;
  const proxyUrl = `http://${auth}@${cleanHost}:${port}`;

  console.log(
    `📡 Configurando proxy: http://${user}:******@${cleanHost}:${port}`,
  );

  return new HttpsProxyAgent(proxyUrl);
}

// Gerenciador de cookies manual
class CookieManager {
  constructor() {
    this.jar = new CookieJar();
  }

  async getCookieString(url) {
    return await this.jar.getCookieString(url);
  }

  async setCookies(cookies, url) {
    if (cookies && Array.isArray(cookies)) {
      for (const cookie of cookies) {
        await this.jar.setCookie(cookie, url);
      }
    } else if (cookies) {
      await this.jar.setCookie(cookies, url);
    }
  }

  async getCookies(url) {
    return await this.jar.getCookies(url);
  }
}

// Função para gerar senha aleatória seguindo os critérios
function generateRandomPassword() {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%¨&*()-=_+[]{}|,.;/:?<>";

  let password = "";

  // Garante pelo menos um de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Completa com caracteres aleatórios até 12-16 caracteres
  const remainingLength = 8 + Math.floor(Math.random() * 8); // 8 a 16 caracteres no total
  const allChars = uppercase + lowercase + numbers + symbols;

  for (let i = password.length; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralha a string
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Função para validar senha
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push("é muito curto (mínimo: 8 caracteres)");
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%¨&*()\-=_+[\]{}|,.;/:?<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
    errors.push(
      "precisa ter uma letra maiúscula, uma letra minúscula, um número e um símbolo ('\"!@#$%¨&*()-=_+[]{}|\\,.;/<>:?)",
    );
  }

  return errors;
}

// Função para resetar senha expirada
async function resetExpiredPassword(email, currentPassword, newPassword) {
  const httpsAgent = getHttpsAgent();

  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 30000,
    httpsAgent: httpsAgent,
    proxy: false,
  });

  const payload = {
    email: email,
    current_password: currentPassword,
    new_password: newPassword,
    new_password_confirmation: newPassword,
  };

  console.log("🔄 Tentando resetar senha expirada...");

  try {
    const response = await axiosInstance.post(
      "/api/v1/users/reset_expired_password",
      payload,
    );

    if (response.data.success) {
      console.log("✅ Senha resetada com sucesso!");

      // Criptografa e salva a nova senha
      const { encrypted, iv } = encryptPassword(newPassword);
      await updateCredentials(email, encrypted, iv);

      // Limpa o cache da sessão
      await redisService.del(CACHE_KEY);

      return { success: true, newPassword };
    } else {
      throw new Error(JSON.stringify(response.data.errors || response.data));
    }
  } catch (err) {
    if (err.response?.data?.errors) {
      const errors = err.response.data.errors;
      console.log("❌ Erros na validação da senha:", errors);

      // Se a senha não atende aos critérios, tenta gerar uma nova
      if (errors.new_password) {
        return { success: false, errors: errors.new_password };
      }
    }
    throw err;
  }
}

// Função principal para tentar login com tratamento de senha expirada
async function tryLoginWithPasswordReset(retryCount = 0) {
  const maxRetries = 3;
  const { email, password } = await getCredentials();

  const httpsAgent = getHttpsAgent();
  const cookieManager = new CookieManager();

  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 30000,
    httpsAgent: httpsAgent,
    proxy: false,
  });

  try {
    console.log("📡 Tentando login...");

    const response = await axiosInstance.post("/api/v1/users/sign_in", {
      user: { email, password, identify_login: true },
    });

    // Login bem sucedido
    if (response.headers["set-cookie"]) {
      await cookieManager.setCookies(response.headers["set-cookie"], BASE_URL);
    }

    const sess = response.data.session;
    const authToken = sess.authentication_token;
    const userId = sess.user_id;

    await redisService.setJson(CACHE_KEY, {
      authToken,
      userId,
      expiry: Date.now() + 15 * 60 * 1000,
    });

    console.log("✅ Login realizado com sucesso!");
    return { authToken, cookieManager, userId };
  } catch (err) {
    // Verifica se é erro de senha expirada
    if (
      err.response?.data?.warden_message === "password_expired" ||
      err.response?.data?.errors?.includes("Sua senha expirou")
    ) {
      console.log("⚠️ Senha expirada detectada!");

      if (retryCount >= maxRetries) {
        throw new Error(
          "Número máximo de tentativas de reset de senha excedido",
        );
      }

      // Gera uma nova senha seguindo os critérios
      let newPassword = generateRandomPassword();
      let validationErrors = validatePassword(newPassword);

      // Garante que a senha é válida
      while (validationErrors.length > 0) {
        console.log("🔄 Gerando nova senha...");
        newPassword = generateRandomPassword();
        validationErrors = validatePassword(newPassword);
      }

      console.log(`🔑 Nova senha gerada: ${newPassword}`);

      // Tenta resetar a senha
      const resetResult = await resetExpiredPassword(
        email,
        password,
        newPassword,
      );

      if (resetResult.success) {
        console.log(
          "✅ Senha resetada com sucesso! Tentando login novamente...",
        );
        // Aguarda um momento antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Tenta login novamente com a nova senha
        return await tryLoginWithPasswordReset(retryCount + 1);
      } else if (resetResult.errors) {
        console.log("❌ Falha ao resetar senha:", resetResult.errors);
        // Se a senha gerada não passou na validação do servidor, tenta uma nova
        if (
          resetResult.errors.includes("deve ser diferente das última 4 senhas")
        ) {
          console.log("🔄 Senha já foi usada recentemente, gerando outra...");
          return await tryLoginWithPasswordReset(retryCount + 1);
        }
        throw new Error(`Falha no reset: ${resetResult.errors.join(", ")}`);
      }
    }

    throw err;
  }
}

// --- FUNÇÕES PRINCIPAIS ---

export async function manusisLogin() {
  console.log("\n=== INICIANDO LOGIN MANUSIS ===");
  console.log(`🌐 URL: ${BASE_URL}`);

  // Verifica cache
  const cached = await redisService.getJson(CACHE_KEY);
  if (cached && cached.expiry > Date.now()) {
    console.log("✅ Usando sessão em cache");
    const cookieManager = new CookieManager();
    return {
      authToken: cached.authToken,
      cookieManager,
      userId: cached.userId,
    };
  }

  // Tenta fazer login com tratamento de senha expirada
  return await tryLoginWithPasswordReset();
}

export async function manusisRequest(method, url, data = null, config = {}) {
  // Obtém sessão
  const { authToken, cookieManager } = await manusisLogin();

  // Configura o agente proxy
  const httpsAgent = getHttpsAgent();

  const isGet = method.toUpperCase() === "GET";

  // Prepara headers
  const headers = {
    Authorization: `Bearer ${authToken}`,
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ...config.headers,
  };

  if (!isGet) {
    headers["Content-Type"] = "application/json";
  }

  const cookieString = await cookieManager.getCookieString(BASE_URL + url);
  if (cookieString) {
    headers.Cookie = cookieString;
  }

  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers,
    timeout: config.timeout || 30000,
    httpsAgent: httpsAgent,
    proxy: false,
  });

  const requestPayload = {
    method,
    url,
    ...config,
  };

  if (data && !isGet) {
    requestPayload.data = data;
  }

  try {
    console.log(`📡 Fazendo requisição ${method} ${url}`);

    const response = await axiosInstance(requestPayload);

    if (response.headers["set-cookie"]) {
      await cookieManager.setCookies(
        response.headers["set-cookie"],
        BASE_URL + url,
      );
    }

    return response.data;
  } catch (err) {
    if (err.response?.status === 401) {
      console.log("⚠️ Token expirado, limpando cache e tentando novamente...");
      await redisService.del(CACHE_KEY);
      return await manusisRequest(method, url, data, config);
    }

    console.log(`❌ Erro na requisição ${method} ${url}:`);
    if (err.response) {
      console.log(`Status: ${err.response.status}`);
      if (
        typeof err.response.data === "string" &&
        err.response.data.includes("<!DOCTYPE")
      ) {
        console.log(
          `Data: [HTML de Erro Retornado pelo Firewall - CloudFront]`,
        );
      } else {
        console.log(`Data:`, err.response.data);
      }
    } else if (err.code === "ECONNABORTED") {
      console.log(`⏱️ Timeout: ${err.message}`);
    } else {
      console.log(`Mensagem: ${err.message}`);
    }

    throw err;
  }
}

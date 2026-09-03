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

  // Obtém credenciais
  const { email, password } = await getCredentials();
  console.log(`📧 Email: ${email}`);

  // Configurações do proxy
  const httpsAgent = getHttpsAgent();
  const cookieManager = new CookieManager();

  // Cria instância do axios sem wrapper
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    timeout: 30000,
    httpsAgent: httpsAgent,
    proxy: false,
  });

  try {
    console.log("📡 Enviando requisição de login...");

    // Faz o login
    const response = await axiosInstance.post("/api/v1/users/sign_in", {
      user: { email, password, identify_login: true },
    });

    // Salva os cookies
    if (response.headers["set-cookie"]) {
      await cookieManager.setCookies(response.headers["set-cookie"], BASE_URL);
    }

    const sess = response.data.session;
    const authToken = sess.authentication_token;
    const userId = sess.user_id;

    // Salva no cache
    await redisService.setJson(CACHE_KEY, {
      authToken,
      userId,
      expiry: Date.now() + 15 * 60 * 1000,
    });

    console.log("✅ Login no Manusis realizado com sucesso!");
    console.log(`🔑 Token: ${authToken.substring(0, 20)}...`);

    return { authToken, cookieManager, userId };
  } catch (err) {
    console.log("\n❌ ERRO NO LOGIN MANUSIS");

    if (err.code === "ECONNABORTED") {
      console.log("⏱️ TIMEOUT - O servidor/proxy não respondeu a tempo");
    } else if (err.response) {
      console.log(`📊 Status: ${err.response.status}`);
      console.log(`📝 Data:`, err.response.data);
    } else {
      console.log(`🔌 Erro: ${err.message}`);
      if (err.cause) console.log(`   Causa: ${err.cause.message}`);
    }

    throw err;
  }
}

export async function manusisRequest(method, url, data = null, config = {}) {
  // Obtém sessão
  const { authToken, cookieManager } = await manusisLogin();

  // Configura o agente proxy
  const httpsAgent = getHttpsAgent();

  const isGet = method.toUpperCase() === "GET";

  // Prepara headers (Removido o Content-Type padrão daqui)
  const headers = {
    Authorization: `Bearer ${authToken}`,
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ...config.headers,
  };

  // Só adicionamos Content-Type se NÃO for GET
  if (!isGet) {
    headers["Content-Type"] = "application/json";
  }

  // Adiciona cookies
  const cookieString = await cookieManager.getCookieString(BASE_URL + url);
  if (cookieString) {
    headers.Cookie = cookieString;
  }

  // Cria instância para a requisição
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

  // Nunca enviar a propriedade 'data' se for GET, nem mesmo como null
  if (data && !isGet) {
    requestPayload.data = data;
  }

  try {
    console.log(`📡 Fazendo requisição ${method} ${url}`);

    const response = await axiosInstance(requestPayload);

    // Atualiza cookies se necessário
    if (response.headers["set-cookie"]) {
      await cookieManager.setCookies(
        response.headers["set-cookie"],
        BASE_URL + url,
      );
    }

    return response.data;
  } catch (err) {
    // Se token expirou, limpa cache e tenta novamente
    if (err.response?.status === 401) {
      console.log("⚠️ Token expirado, limpando cache e tentando novamente...");
      await redisService.del(CACHE_KEY);
      return await manusisRequest(method, url, data, config);
    }

    console.log(`❌ Erro na requisição ${method} ${url}:`);
    if (err.response) {
      console.log(`Status: ${err.response.status}`);
      // Se for HTML gigante, não polui o log
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

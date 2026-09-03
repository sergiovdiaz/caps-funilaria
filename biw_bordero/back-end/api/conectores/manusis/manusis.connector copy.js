import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import crypto from "crypto";
import { pool } from "../../postgreConnect.js";
import { redisService } from "../redis/redis.service.js";

const ALGO = "aes-256-cbc";
const KEY = Buffer.from(process.env.CRYPT_KEY, "hex");
const BASE_URL = process.env.MANUSIS_BASE_URL;
const CACHE_KEY = "manusis:session";

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

export async function manusisLogin() {
  console.log("Tentando login no Manusis...");

  const cached = await redisService.getJson(CACHE_KEY);
  if (cached && cached.expiry > Date.now()) {
    console.log("✅ Usando sessão em cache");
    const jar = new CookieJar(); // preciso de jar para manter compatibilidade
    const client = wrapper(
      axios.create({ baseURL: BASE_URL, jar, withCredentials: true }),
    );
    client.defaults.headers.common["Authorization"] =
      `Bearer ${cached.authToken}`;
    client.defaults.headers.common["User-Agent"] = "python-requests/2.31.0";
    return client;
  }

  const { email, password } = await getCredentials();
  console.log("Credenciais obtidas:", email);

  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      baseURL: BASE_URL,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "python-requests/2.31.0",
      },
      jar,
      withCredentials: true,
      timeout: 30000,
    }),
  );

  // login
  const resp = await client.post("/api/v1/users/sign_in", {
    user: { email, password, identify_login: true },
  });

  const sess = resp.data.session;
  const authToken = sess.authentication_token;
  const userId = sess.user_id;

  // salva cache
  await redisService.setJson(CACHE_KEY, {
    authToken,
    userId,
    expiry: Date.now() + 15 * 60 * 1000,
  });

  // atualiza header Authorization
  client.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

  console.log("✅ Login no Manusis realizado com sucesso!");
  return client;
}

export async function manusisRequest(method, url, data = null, config = {}) {
  let client = await manusisLogin();
  try {
    return (await client.request({ method, url, data, ...config })).data;
  } catch (err) {
    if (err.response?.status === 401) {
      client = await manusisLogin();
      return (await client.request({ method, url, data, ...config })).data;
    }
    throw err;
  }
}

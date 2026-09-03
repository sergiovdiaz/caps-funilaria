//redis_connector
import { createClient } from "redis";


// Configurações do Redis (pode usar variáveis de ambiente)
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || null;
console.log("Configurações do Redis - Host:", REDIS_HOST, "Porta:", REDIS_PORT);

// Cria o cliente Redis
export const redisClient = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
  password: REDIS_PASSWORD,
});

// Evento de erro
redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Conecta
await redisClient
  .connect()
  .then(() => console.log("✅ Conectado ao Redis com sucesso!"))
  .catch((err) => console.error("❌ Erro ao conectar no Redis:", err));

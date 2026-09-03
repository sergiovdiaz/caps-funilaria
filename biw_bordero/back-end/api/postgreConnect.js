import pg from "pg";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

// Configuração
const envPath = path.resolve(process.cwd(), "..", ".env");
dotenv.config({ path: envPath });

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

/**
 * Converte timestamp em ms para formato ISO com timezone
 * @param {number} timestamp - Timestamp em milissegundos
 * @returns {string} Data no formato ISO 8601
 */

function toISOTimestamp(timestamp) {
  if (!timestamp) return null;

  // Se já estiver no formato ISO com 'T' e 'Z', retorna diretamente
  if (timestamp.includes("T") && timestamp.endsWith("Z")) {
    // Adiciona 3 horas ao timestamp ISO
    const date = new Date(timestamp);
    date.setHours(date.getHours());
    return date.toISOString();
  }

  // Se estiver no formato 'YYYY-MM-DDTHH:MM' (sem segundos)
  if (
    timestamp.includes("T") &&
    timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  ) {
    // Adiciona segundos e depois adiciona 3 horas
    const date = new Date(timestamp + ":00");
    date.setHours(date.getHours());
    return date.toISOString();
  }

  // Se estiver em outro formato, converte para Date, adiciona 3 horas e depois para ISO
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Formato de timestamp inválido: ${timestamp}`);
  }

  date.setHours(date.getHours());
  return date.toISOString();
}




/**
 * Busca usuário pelo campo matricula
 */
// Retorna usuário pelo matricula
export async function getUserByMatricula(matricula) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        u.matricula,
        u.nome,
        u.area,
        u.ute,
        u.cresp,
        u.cargo,
        u.turno,
        u.password_hash,
        u.ativo,
        u.ultimo_login,
        u.role_id,
        r.nome AS role
    FROM auth.usuarios u
    LEFT JOIN auth.roles r
        ON r.id = u.role_id
    WHERE u.matricula = $1
    LIMIT 1;
    `;
    const { rows } = await client.query(query, [matricula]);
    return rows[0] || null;
  } catch (err) {
    console.error("Erro getUserByMatricula:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Atualiza usuário pela matricula
export async function updateUser(matricula, data) {
  const client = await pool.connect();
  try {
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in data) {
      fields.push(`${key} = $${i}`);
      values.push(data[key]);
      i++;
    }

    if (fields.length === 0) return getUserByMatricula(matricula);

    const query = `
      UPDATE auth.usuarios
      SET ${fields.join(", ")}
      WHERE matricula = $${i}
      RETURNING matricula, nome, area, ute, cresp, cargo, turno, ativo, ultimo_login
    `;
    values.push(matricula);

    const { rows } = await client.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("Erro updateUser:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Cria novo usuário
export async function createUser({ matricula, nome, senha, ...rest }) {
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO auth.usuarios (
        matricula, nome, password_hash, ativo, ultimo_login${Object.keys(rest).length ? ", " + Object.keys(rest).join(", ") : ""}
      )
      VALUES (
        $1, $2, $3, true, NOW()${
          Object.keys(rest).length
            ? ", " +
              Object.keys(rest)
                .map((_, i) => `$${i + 4}`)
                .join(", ")
            : ""
        }
      )
      RETURNING matricula, nome, ativo, ultimo_login
    `;
    const values = [matricula, nome, hash, ...Object.values(rest)];
    const { rows } = await client.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("Erro createUser:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function createUser2({
  matricula,
  nome,
  sobrenome,
  area,
  password_hash,
}) {
  const client = await pool.connect();
  try {
    // Cria nome completo em UPPERCASE
    const nomeCompleto = `${nome} ${sobrenome}`.toUpperCase();

    const query = `
      INSERT INTO auth.usuarios (matricula, nome, area, password_hash, ativo)
      VALUES ($1, $2, $3, $4, true)
      RETURNING matricula, nome, area, ativo
    `;

    const values = [matricula, nomeCompleto, area, password_hash];

    const { rows } = await client.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("Erro createUser:", err);
    throw err;
  } finally {
    client.release();
  }
}

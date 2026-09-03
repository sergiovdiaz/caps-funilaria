import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  getUserByMatricula,
  updateUser,
  createUser2,
} from "./postgreConnect.js";
import { authMiddleware } from "./middlewares/auth.js";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Duração dos tokens
const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "5h";

// POST /authentication/login
router.post("/login", async (req, res) => {
  const { matricula, senha } = req.body;
  if (!matricula || !senha)
    return res.status(400).json({ error: "Matrícula e senha obrigatórios" });

  try {
    const usuario = await getUserByMatricula(matricula);
    if (!usuario || !usuario.ativo)
      return res
        .status(401)
        .json({ error: "Usuário não encontrado ou inativo" });

    const senhaValida = await bcrypt.compare(senha, usuario.password_hash);
    if (!senhaValida) return res.status(401).json({ error: "Senha incorreta" });

    const payload = {
      matricula: usuario.matricula,
      nome: usuario.nome,
      area: usuario.area,
      role: usuario.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES,
    });

    res.json({
      usuario: {
        matricula: usuario.matricula,
        nome: usuario.nome,
        area: usuario.area,
        role: usuario.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Erro login:", err);
    res.status(500).json({ error: "Erro interno ao autenticar" });
  }
});

// POST /authentication/refresh-token
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: "Refresh token é obrigatório" });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      {
        matricula: payload.matricula,
        nome: payload.nome,
        area: payload.area,
        role: payload.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES },
    );

    res.json({ accessToken });
  } catch (err) {
    console.error("Erro refresh-token:", err);
    res.status(403).json({ error: "Refresh token inválido" });
  }
});

// POST /authentication/logout
router.post("/logout", authMiddleware, async (req, res) => {
  // opcional: invalidar refreshToken no banco
  res.json({ message: "Logout realizado com sucesso" });
});

// PUT /authentication/edit-profile
router.put("/edit-profile", authMiddleware, async (req, res) => {
  const { nome, area, cargo } = req.body;
  try {
    const usuarioAtualizado = await updateUser(req.user.matricula, {
      nome,
      area,
      cargo,
    });
    res.json({ usuario: usuarioAtualizado });
  } catch (err) {
    console.error("Erro edit-profile:", err);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

// PUT /authentication/change-password
router.put("/change-password", authMiddleware, async (req, res) => {
  const { senhaAntiga, senhaNova } = req.body;
  if (!senhaAntiga || !senhaNova)
    return res.status(400).json({ error: "Senha antiga e nova obrigatórias" });

  try {
    const usuario = await getUserByMatricula(req.user.matricula);
    const senhaValida = await bcrypt.compare(
      senhaAntiga,
      usuario.password_hash,
    );
    if (!senhaValida)
      return res.status(401).json({ error: "Senha antiga incorreta" });

    const senhaHash = await bcrypt.hash(senhaNova, 10);
    await updateUser(req.user.matricula, { password_hash: senhaHash });

    res.json({ message: "Senha atualizada com sucesso" });
  } catch (err) {
    console.error("Erro change-password:", err);
    res.status(500).json({ error: "Erro ao atualizar senha" });
  }
});

// POST /authentication/register
router.post("/register", async (req, res) => {
  const { matricula, nome, sobrenome, area } = req.body;
  console.log(req.body);

  if (!matricula || !nome || !sobrenome || !area) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  try {
    const existingUser = await getUserByMatricula(matricula);
    if (existingUser) {
      return res.status(409).json({ error: "Usuário já existe" });
    }

    // Cria a senha hash usando a matrícula
    const passwordHash = await bcrypt.hash(matricula, 10);
    console.log(passwordHash);

    const newUser = {
      matricula,
      nome,
      sobrenome,
      area,
      password_hash: passwordHash,
      ativo: true,
      roles: [], // pode definir roles padrão se quiser
    };

    // Função que insere no banco
    const usuarioCriado = await createUser2({
      matricula,
      nome,
      sobrenome,
      area,
      password_hash: passwordHash,
    });
    // o 'true' indica que é insert, não update, depende da sua função

    res.status(201).json({
      usuario: {
        matricula: usuarioCriado.matricula,
        nome: usuarioCriado.nome,
        sobrenome: usuarioCriado.sobrenome,
        area: usuarioCriado.area,
        roles: usuarioCriado.roles,
      },
      message:
        "Usuário criado com sucesso. Senha inicial é a própria matrícula",
    });
  } catch (err) {
    console.error("Erro register:", err);
    res.status(500).json({ error: "Erro interno ao criar usuário" });
  }
});

export default router;

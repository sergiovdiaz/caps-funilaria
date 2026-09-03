// src/routes/cap.routes.js
import express from "express";

import {
  listarValidacaoPendencias,
  listarJustificativasPendencias,
  criarJustificativa,
  getHistoricoJustificativa,
  listarJustificativas,
  listarMaquinas,
  reprovarJustificativa,
  aprovarJustificativa,
} from "../../../postgreConnect.js";

import {
  getCapAlarms,
  getCapHistoricoJusticativas,
  getCapProd,
} from "../../../capData.js";

const router = express.Router();

// =========================
//         CAP ROUTES
// =========================

// GET /cap/alarms
router.get("/alarms", async (req, res) => {
  const { line, starttimestamp, endtimestamp } = req.query;

  if (!line || !starttimestamp || !endtimestamp) {
    return res.status(400).json({
      error: "Parâmetros obrigatórios: line, starttimestamp, endtimestamp",
    });
  }

  try {
    const data = await getCapAlarms(line, [starttimestamp, endtimestamp]);
    return res.json(data);
  } catch (error) {
    console.error("Erro no getCapAlarms:", error);
    return res.status(500).json({ error: "Erro interno ao buscar CAP ALARMS" });
  }
});

// POST /cap/justificativa
router.post("/justificativa", async (req, res) => {
  try {
    const result = await criarJustificativa(req.body);
    res.json({ ...result, createdAt: new Date() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar justificativa" });
  }
});

// GET /cap/justificativa/:id
router.get("/justificativa/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const historico = await getHistoricoJustificativa(id);

    if (!historico || historico.length === 0) {
      return res.status(404).json({ error: "Justificativa não encontrada" });
    }

    res.json({ idJustificativa: id, historico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar justificativa" });
  }
});

// POST /cap/justificativa/reprovar
router.post("/justificativa/reprovar", async (req, res) => {
  const { id_justificativa, matricula, ...novosDados } = req.body;

  if (!id_justificativa || !matricula) {
    return res
      .status(400)
      .json({ error: "Parâmetros obrigatórios: id_justificativa, matricula" });
  }

  try {
    const result = await reprovarJustificativa(id_justificativa, {
      matricula,
      ...novosDados,
    });

    if (!result.ok) return res.status(400).json({ error: result.message });

    return res.json({ message: result.message, updatedAt: new Date() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno ao reprovar justificativa" });
  }
});

// POST /cap/justificativa/aprovar
router.post("/justificativa/aprovar", async (req, res) => {
  const { id_justificativa, matricula, ...novosDados } = req.body;

  if (!id_justificativa || !matricula) {
    return res
      .status(400)
      .json({ error: "Parâmetros obrigatórios: id_justificativa, matricula" });
  }

  try {
    // console.log({ matricula, ...novosDados });
    const result = await aprovarJustificativa(id_justificativa, {
      matricula,
      ...novosDados,
    });

    if (!result.ok) return res.status(400).json({ error: result.message });

    return res.json({ message: result.message, updatedAt: new Date() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno ao aprovar justificativa" });
  }
});

// GET /cap/justificativas/listar
router.get("/justificativas/listar", async (req, res) => {
  try {
    const resultados = await listarJustificativas(req.query);
    res.json(resultados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar justificativas" });
  }
});

// GET /cap/validacao/pendencias
router.get("/validacao/pendencias", async (req, res) => {
  try {
    const resultados = await listarValidacaoPendencias(req.query);
    res.json(resultados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar pendências de validação" });
  }
});

// GET /cap/justificativas/pendencias
router.get("/justificativas/pendencias", async (req, res) => {
  try {
    const resultados = await listarJustificativasPendencias(req.query);
    res.json(resultados);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao listar pendências de justificativas" });
  }
});

// GET /cap/maquinas/listar
router.get("/maquinas/listar", async (req, res) => {
  try {
    const resultados = await listarMaquinas(req.query);
    res.json(resultados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar máquinas" });
  }
});

// GET /cap/producao
router.get("/producao", async (req, res) => {
  const { date, line } = req.query;

  if (!line || !date) {
    return res
      .status(400)
      .json({ error: "Parâmetros obrigatórios: line, date" });
  }

  try {
    const resultado = await getCapProd(line, date);
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erro interno ao buscar produção",
      details: error.message,
    });
  }
});

// GET /cap/history
router.get("/history", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Parâmetros obrigatórios: startDate, endDate" });
  }

  try {
    const resultado = await getCapHistoricoJusticativas(startDate, endDate);
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erro interno ao buscar histórico CAP",
      details: error.message,
    });
  }
});

export default router;

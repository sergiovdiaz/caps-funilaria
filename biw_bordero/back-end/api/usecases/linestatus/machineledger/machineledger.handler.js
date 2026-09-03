//machineledger.handler.js
import * as mlService from "./machineledger.service.js";

export async function getUtes(req, res) {
  try {
    const data = await mlService.fetchUtes();
    return res.json(data);
  } catch (err) {
    console.error("Erro getUtes:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getLinhas(req, res) {
  try {
    const { ute } = req.query;
    const data = await mlService.fetchLinhas(ute);
    return res.json(data);
  } catch (err) {
    console.error("Erro getLinhas:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getOperacoes(req, res) {
  try {
    const { linha } = req.query;
    if (!linha) {
      return res.status(400).json({ error: "Parâmetro linha é obrigatório" });
    }

    const data = await mlService.fetchOperacoes(linha);
    return res.json(data);
  } catch (err) {
    console.error("Erro getOperacoes:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getTipos(req, res) {
  try {
    const { linha, operacao } = req.query;
    if (!linha || !operacao) {
      return res
        .status(400)
        .json({ error: "Parâmetros linha e operacao são obrigatórios" });
    }

    const data = await mlService.fetchTipos(linha, operacao);
    // console.log(data);
    return res.json(data);
  } catch (err) {
    console.error("Erro getTipos:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getMaquinas(req, res) {
  try {
    const { linha, operacao, tipoMaquina } = req.query;
    if (!linha || !operacao || !tipoMaquina) {
      return res.status(400).json({
        error: "Parâmetros linha, operacao e tipoMaquina são obrigatórios",
      });
    }

    const data = await mlService.fetchMaquinas(linha, operacao, tipoMaquina);
    return res.json(data);
  } catch (err) {
    console.error("Erro getMaquinas:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getComponentes(req, res) {
  try {
    const { maquina } = req.query;
    if (!maquina) {
      return res.status(400).json({ error: "Parâmetro maquina é obrigatório" });
    }

    const data = await mlService.fetchComponentes(maquina);
    return res.json(data);
  } catch (err) {
    console.error("Erro getComponentes:", err);
    return res.status(500).json({ error: err.message });
  }
}

// Search global
export async function getSearchResults(req, res) {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "Parâmetro query é obrigatório" });
    }

    const results = await mlService.searchMachineLedger(query);
    return res.json(results);
  } catch (err) {
    console.error("Erro getSearchResults:", err);
    return res.status(500).json({ error: err.message });
  }
}

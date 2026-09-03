//pcm.handler.js

import * as pcmService from "./pcm.service.js";

export async function uploadPCM(req, res) {
  try {
    const { ano, semana, overwrite } = req.body;
    // console.log(req.body);

    if (!req.file || !ano || !semana) {
      return res.status(400).json({
        error: "Arquivo, ano e semana são obrigatórios",
      });
    }

    const result = await pcmService.processUpload({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      ano,
      semana,
      overwrite: overwrite === "true" || overwrite === true,
      user: req.user,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro uploadPCM:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getPCM(req, res) {
  try {
    const data = await pcmService.getProgramacao(
      Number(req.query.ano) || null,
      Number(req.query.semana) || null,
    );

    return res.json(data);
  } catch (error) {
    console.error("Erro getPCM:", error);
    return res.status(500).json({ error: error.message });
  }
}

//pcm.service.js
import * as pgService from "./pcm.pgService.js";
import { parseExcel } from "./pcm.parser.js";
import { salvarParserComoExcel } from "./salvarExcel.js";

export async function processUpload({
  fileBuffer,
  fileName,
  ano,
  semana,
  overwrite,
  user,
}) {
  if (!user || !user.matricula) {
    throw new Error("Usuário inválido para auditoria");
  }

  // 1️⃣ Verificar se já existem dados
  const exists = await pgService.checkIfExists(ano, semana);

  if (exists && !overwrite) {
    return {
      conflict: true,
      existing: {
        nome: exists.nome,
        uploadedAt: exists.uploaded_at,
      },
    };
  }

  // 2️⃣ Parse do Excel
  const { disponibilidade, atividades, weekMismatch } = await parseExcel(
    fileBuffer,
    ano,
    semana,
  );

  if (weekMismatch) {
    return {
      success: false,
      type: "week_mismatch",
      ...weekMismatch,
    };
  }

  //  Verifica se tem dados em ambas as planilhas
  const problemas = [];

  if (!disponibilidade || disponibilidade.length === 0) {
    problemas.push("LISTA DE PRESENÇA");
  }

  if (!atividades || atividades.length === 0) {
    problemas.push("PLANO CONTROLE");
  }

  if (problemas.length > 0) {
    return {
      success: false,
      type: "no_data",
      message: `Houve um problema no processamento das seguintes planilhas: ${problemas.join(
        " e ",
      )}. Verifique se as planilhas existem, se os dados estão corretos e seguem o formato esperado.`,
    };
  }

  // salvarParserComoExcel(disponibilidade, atividades, "parser_teste.xlsx");

  // 3️⃣ Salvar no banco
  await pgService.saveProgramacao({
    ano,
    semana,
    disponibilidade,
    atividades,
    overwrite,
    user,
    fileName,
  });

  return {
    success: true,
    insertedDisponibilidade: disponibilidade.length,
    insertedAtividades: atividades.length,
  };
}

export async function getProgramacao(ano, semana) {
  // Pega os dados da semana do banco
  const byColaborador = await pgService.getProgramacaoPorColaborador(
    ano,
    semana,
  );
  const byLinha = await pgService.getProgramacaoPorLinha(ano, semana);

  // Pega startDate e endDate da semana para o Gantt
  const weekRange = await pgService.getSemanaRange(ano, semana);

  // Se não tiver range ou nenhuma programação, retorna mensagem de "sem dados"
  if (!weekRange || (!byColaborador.length && !byLinha.length)) {
    return {
      success: false,
      message: "Não há dados para esta semana/ano",
      ano,
      semana,
      byColaborador: [],
      byLinha: [],
      startDate: null,
      endDate: null,
    };
  }

  return {
    ano: weekRange.ano,
    semana: weekRange.semana,
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
    byColaborador,
    byLinha,
  };
}

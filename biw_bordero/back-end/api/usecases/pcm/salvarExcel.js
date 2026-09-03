import * as XLSX from "xlsx";
import fs from "fs";

export function salvarParserComoExcel(
  disponibilidade,
  atividades,
  caminho = "parser_saida.xlsx",
) {
  const wb = XLSX.utils.book_new();

  // ===== Planilha de Disponibilidade =====
  if (disponibilidade.length > 0) {
    const headersDisp = [
      "ano",
      "semana",
      "dataCompleta",
      "turno",
      "horas",
      "inicio",
      "fim",
      "reg",
      "nome",
      "espec",
      "empresa",
      "tipocontrato",
    ];

    const wsDisp = XLSX.utils.json_to_sheet(
      disponibilidade.map((row) => {
        const obj = {};
        headersDisp.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      }),
      { header: headersDisp },
    );

    XLSX.utils.book_append_sheet(wb, wsDisp, "Disponibilidade");
  }

  // ===== Planilha de Atividades =====
  if (atividades.length > 0) {
    const headersAtiv = [
      "ano",
      "semana",
      "macroAtiv",
      "statusPCM",
      "criticidade",
      "prioridade",
      "tipoAtividade",
      "direc",
      "ordem",
      "data",
      "turno",
      "grupo",
      "linha",
      "op",
      "maquina",
      "atividade",
      "nomeMdo",
      "obs",
      "preDisposicoes",
      "inicioAtiv",
      "fimAtiv",
    ];

    const wsAtiv = XLSX.utils.json_to_sheet(
      atividades.map((row) => {
        const obj = {};
        headersAtiv.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      }),
      { header: headersAtiv },
    );

    XLSX.utils.book_append_sheet(wb, wsAtiv, "Atividades");
  }
  // ===== Salvar arquivo =====
  if (wb.SheetNames.length === 0) {
    console.warn("Nenhum dado para gerar Excel.");
    return;
  }

  XLSX.writeFile(wb, caminho);
  console.log("Arquivo Excel de parser salvo em:", caminho);
}

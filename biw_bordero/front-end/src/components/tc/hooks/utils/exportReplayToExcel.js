import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportReplayToExcel = ({
  replayData,
  selectedLine,
  startDate,
  endDate,
}) => {
  if (!replayData || !replayData.stations) {
    alert("Sem dados para exportar.");
    return;
  }

  const workbook = XLSX.utils.book_new();
  const allRows = [];

  Object.entries(replayData.stations).forEach(([station, data]) => {
    if (!data || data.length === 0) return;

    data.forEach((item) => {
      allRows.push({
        Timestamp: new Date(item._timestamp), 
        Linha: selectedLine,
        Estacao: station,
        Modelo: item.model,
        CycleTime: Number(item.tcdata),
        Target: Number(item.target),
        ID: item.id,
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(allRows, {
    cellDates: true,
  });

  // 🔥 Timestamp agora é coluna 0
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].t = "d";
      worksheet[cellAddress].z = "dd/mm/yyyy hh:mm:ss";
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, "Replay");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    cellDates: true,
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const safeStart = startDate?.replace(/[:]/g, "-");
  const safeEnd = endDate?.replace(/[:]/g, "-");

  saveAs(blob, `Replay_${selectedLine}_${safeStart}_${safeEnd}.xlsx`);
};

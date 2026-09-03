import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const formatDateTime = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");

  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
};

export const exportToExcel = ({ data, columns, fileName = "relatorio" }) => {
  if (!data || !data.length) return;

  const exportData = data.map((row) => {
    const obj = {};

    columns.forEach((col) => {
      obj[col.label] = row[col.key];
    });

    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(blob, `${fileName}_${formatDateTime()}.xlsx`);
};

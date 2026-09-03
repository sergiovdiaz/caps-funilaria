export const getStatusColor = (status) => {
  switch (status) {
    case "PENDENTE_VALIDACAO":
      return "#f0ad4e"; // amarelo
    case "EM_REVISAO":
      return "#0275d8"; // azul
    case "FINALIZADA":
      return "#5cb85c"; // verde
    default:
      return "#6c757d"; // cinza
  }
};

export const formatMinutesToMMSS = (minutes) => {
  if (!minutes || isNaN(minutes)) return "00:00";

  const totalSeconds = Math.round(minutes * 60);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;

  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

export const formatMinutesToHHMM = (minutes) => {
  if (!minutes && minutes !== 0) return "00:00";

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const formatMinutesToHHMMSS = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === "") {
    return "00:00:00";
  }

  const parsed = parseFloat(minutes);

  if (isNaN(parsed)) {
    return "00:00:00";
  }

  const totalSeconds = Math.round(parsed * 60);

  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

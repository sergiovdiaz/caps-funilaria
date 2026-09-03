// constants/options.js
import { formatMinutesToHHMMSS } from "../../../cap/utils/capUtils";
export const UTE_OPTIONS = [
  { value: 1, label: "UTE 1" },
  { value: 2, label: "UTE 2" },
  { value: 3, label: "UTE 3" },
];

export const LINE_TYPE_OPTIONS = [
  { value: "TRANSPORTADORES", label: "Transportadores" },
  { value: "LINHAS PRODUTIVAS", label: "Linhas Produtivas" },
];

export const FILTER_LABELS = {
  line: "Linha",
  maquina: "Máquina",
  linestation: "Estação",
  semana: "Semana",
  nivel: "Nível",
  event_id: "Evento",
  startDate: "Data Inicial",
  endDate: "Data Final",
  ute: "UTE",
  line_type: "Tipo Linha",
};

export const TABLE_COLUMNS = [
  { key: "line", label: "Linha", sortable: true, filterable: true },
  { key: "maquina", label: "Máquina", sortable: true, filterable: true },
  { key: "component", label: "Componente", sortable: true, filterable: true },
  { key: "alarm", label: "Alarme", sortable: true, filterable: true },
  {
    key: "loss_min",
    label: "Duração Total",
    sortable: true,
    formatter: (v) => formatMinutesToHHMMSS(v),
  },
  { key: "ocorrencias", label: "Ocorrências", sortable: true },
];

// constants/chartConfig.js
export const BASE_CHART_OPTIONS = {
  chart: {
    toolbar: { show: false },
    background: "transparent",
    fontFamily: "var(--font-family)",
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      borderRadiusApplication: "end",
    },
  },
  grid: {
    borderColor: "var(--border-light)",
    strokeDashArray: 4,
    padding: { top: 0, right: 8, bottom: 0, left: 8 },
  },
  dataLabels: {
    enabled: true,
    style: {
      fontSize: "var(--font-xxs)",
      fontFamily: "var(--font-family)",
      fontWeight: 500,
      colors: ["#fff"],
    },
    dropShadow: { enabled: false },
  },
  tooltip: {
    theme: "light",
    style: {
      fontSize: "var(--font-xs)",
      fontFamily: "var(--font-family)",
    },
  },
  legend: { show: false },
  states: {
    hover: { filter: { type: "lighten", value: 0.1 } },
    active: { filter: { type: "darken", value: 0.15 } },
  },
};

export const LABEL_STYLE = {
  fontSize: "var(--font-xxs)",
  colors: "var(--text-secondary)",
  fontFamily: "var(--font-family)",
};

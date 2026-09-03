// ─── SAP Navigator — barrel exports ──────────────────────────────────────────

// Página
export { default as SAPNavigatorPage } from "./pages/SAPNavigatorPage";

// Componentes individuais (caso precise reutilizar)
export { default as MachineView } from "./components/sap-navigator/MachineView";
export { default as ComponentCard } from "./components/sap-navigator/ComponentCard";
export { default as ComponentesList } from "./components/sap-navigator/ComponentesList";
export { default as SearchResults } from "./components/sap-navigator/SearchResults";

// UI primitivos
export {
  Breadcrumb,
  Chip,
  TecBadge,
  SearchBar,
  NavCard,
  MachineThumbnail,
  CountBadge,
} from "./components/sap-navigator/ui";

// Dados e tema
export { SAP_DATA } from "./data/sapData";
export { C as theme } from "./constants/theme";

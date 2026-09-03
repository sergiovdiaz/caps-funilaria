import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSinopticoAndon } from "./hooks/useSinopticoAndon.js";
import DashboardHeader from "./DashboardHeader.jsx";
import MainPerformanceCard from "./MainPerformanceCard.jsx";
import BufferCard from "./BufferCard.jsx";
import OperationsTable from "./OperationsTable.jsx";
import LineStatusCard from "./LineStatusCard.jsx";
import "./styles/SinopticoAndon.css";

// Ícones SVG simples para não depender de bibliotecas externas
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function SinopticoAndon() {
  const { line } = useParams();

  // 🔹 Agora usamos DOIS hooks separados
  const productivity = useSinopticoAndon(line, "productivity");
  const station = useSinopticoAndon(line, "station");
  const buffers = useSinopticoAndon(line, "buffer");
  const linestatus = useSinopticoAndon(line, "linestatus");

  // --- DARK MODE ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };
  // ------------------

  // 🔹 Proteção contra undefined

  return (
    <div className="dashboard__container" data-theme={theme}>
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title="Alternar Tema"
      >
        {theme === "light" ? <MoonIcon /> : <SunIcon />}
      </button>

      <DashboardHeader line={line} />

      <div className="dashboard__main-grid">
        <main className="dashboard__content-area">
          <div className="cards__row">
            <div className="cards__main">
              <MainPerformanceCard data={productivity ?? {}} />
            </div>

            <div className="cards__side">
              <BufferCard buffers={buffers ?? {}} line={line} />
            </div>
          </div>
          {/* 
          <div className="production-banner">
            <div className="banner-text">PRODUÇÃO</div>
            <div className="banner-subtitle">Sistema Operacional</div>
          </div> */}
          {/* LINESTATUS CARD */}
          <LineStatusCard data={linestatus} />

          {/* 🔹 Station vai pra tabela */}
          <OperationsTable
            operations={station ?? []}
            linestatus={linestatus ?? {}}
          />
        </main>
      </div>
    </div>
  );
}

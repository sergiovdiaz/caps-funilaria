import React, { useState, useEffect } from "react";

import CapPendenciasValidacao from "./CapPendenciasValidacao";
import CapPendenciasJustificativa from "./CapPendenciasJustificativa";

import {
  getCapListarJustificativasPendentes,
  getCapListarValidacoesPendentes,
} from "../../../api/cap.http";

import "./styles/CapResumoPendencias.css";

// =============================
// CONSTANTES
// =============================
const SHIFTS = [
  { value: "Todos", label: "Todos" },
  { value: "TURNO 3", label: "Turno 3" },
  { value: "TURNO 1", label: "Turno 1" },
  { value: "TURNO 2", label: "Turno 2" },
];

const UTE = [
  { value: "Todos", label: "Todos" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

// =============================
// COMPONENTES AUXILIARES
// =============================
const FilterLabel = ({ label, children }) => (
  <label className="cap__filter-label">
    {label}
    {children}
  </label>
);

const ShiftSelect = ({ value, onChange, onReset, options }) => (
  <div className="shift-select">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="shift-select__input"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>

    {value !== "Todos" && (
      <button
        type="button"
        onClick={onReset}
        title="Resetar"
        className="shift-select__reset"
      >
        ×
      </button>
    )}
  </div>
);

// =============================
// FILTROS
// =============================
const Filters = ({
  selectedDate,
  setSelectedDate,
  selectedShift,
  setSelectedShift,
  selectedUte,
  setSelectedUte,
}) => (
  <div
    className="cap__filters"
    style={{ top: "130px", right: "35px", background: "transparent" }}
  >
    <FilterLabel label="Data">
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
    </FilterLabel>

    <FilterLabel label="Turno">
      <ShiftSelect
        value={selectedShift}
        onChange={setSelectedShift}
        onReset={() => setSelectedShift("Todos")}
        options={SHIFTS}
      />
    </FilterLabel>

    {/* Futuro uso */}
    {/* <FilterLabel label="UTE">
      <ShiftSelect
        value={selectedUte}
        onChange={setSelectedUte}
        onReset={() => setSelectedUte("Todos")}
        options={UTE}
      />
    </FilterLabel> */}
  </div>
);

// =============================
// COMPONENTE PRINCIPAL
// =============================
const CapResumoPendencias = () => {
  // =============================
  // STATE
  // =============================
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState("Todos");
  const [selectedUte, setSelectedUte] = useState("Todos");

  const [pendencias, setPendencias] = useState({});
  const [pendenciasJust, setPendenciasJust] = useState({});

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("validacoes");

  // =============================
  // INIT DATE DEFAULT
  // =============================
  useEffect(() => {
    const now = new Date();
    now.setHours(now.getHours() - 1);

    setSelectedDate(now.toISOString().split("T")[0]);
  }, []);

  // =============================
  // FETCH DATA
  // =============================
  const fetchPendencias = async () => {
    if (!selectedDate) return;

    setLoading(true);

    try {
      const [validacoes, justificativas] = await Promise.all([
        getCapListarValidacoesPendentes({
          dataSelecionada: selectedDate,
        }),
        getCapListarJustificativasPendentes({
          dataSelecionada: selectedDate,
        }),
      ]);

      setPendencias(validacoes);
      setPendenciasJust(justificativas);
    } catch (error) {
      console.error("Erro ao buscar pendências:", error);
      setPendencias({});
      setPendenciasJust([]);
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // EFFECT FETCH
  // =============================
  useEffect(() => {
    fetchPendencias();
  }, [selectedDate]);

  // =============================
  // FILTERS
  // =============================
  const justificativasFiltradas =
    selectedShift === "Todos"
      ? pendenciasJust
      : pendenciasJust.filter((item) => item.turno === selectedShift);

  // =============================
  // RENDER
  // =============================
  return (
    <div className="cap-resumo-pendencias">
      {/* FILTROS */}
      <Filters
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedShift={selectedShift}
        setSelectedShift={setSelectedShift}
        selectedUte={selectedUte}
        setSelectedUte={setSelectedUte}
      />

      {/* TABS */}
      <div className="cap-resumo-pendencias__tabs">
        <button
          className={`cap-resumo-pendencias__tab ${
            activeTab === "validacoes" ? "active" : ""
          }`}
          onClick={() => setActiveTab("validacoes")}
        >
          Validações
        </button>

        <button
          className={`cap-resumo-pendencias__tab ${
            activeTab === "justificativas" ? "active" : ""
          }`}
          onClick={() => setActiveTab("justificativas")}
        >
          Justificativas
        </button>
      </div>

      {/* CONTENT */}
      <div className="cap-resumo-pendencias__content">
        {/* VALIDAÇÕES */}
        {activeTab === "validacoes" && (
          <>
            {loading && (
              <p className="cap-resumo-pendencias__loading">
                Carregando pendências...
              </p>
            )}

            {!loading &&
              Object.entries(pendencias).map(([responsavel, dados]) => (
                <CapPendenciasValidacao
                  key={responsavel}
                  responsavel={responsavel}
                  items={dados.items}
                  resumo={dados.resumo}
                />
              ))}

            {!loading && Object.keys(pendencias).length === 0 && (
              <p className="cap-resumo-pendencias__empty">
                Nenhuma pendência encontrada para a data selecionada.
              </p>
            )}
          </>
        )}

        {/* JUSTIFICATIVAS */}
        {activeTab === "justificativas" && (
          <CapPendenciasJustificativa dados={justificativasFiltradas} />
        )}
      </div>
    </div>
  );
};

export default CapResumoPendencias;

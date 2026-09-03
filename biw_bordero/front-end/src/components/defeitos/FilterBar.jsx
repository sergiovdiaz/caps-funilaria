import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { format } from "date-fns";

// Dados Fixos - AGORA COM VALORES NUMÉRICOS E TEXTOS
export const turnos = [
  { value: 1, label: "Turno 1" },
  { value: 2, label: "Turno 2" },
  { value: 3, label: "Turno 3" },
];
export const modelos = ["521", "551", "598", "226", "291"];
export const defeitos = [
  "228 - INTERFERÊNCIA CONTATO (TLC)",
  "104 - JOGO IRREGULAR (JR)",
  "046 - AFLORAMENTO (DA)",
  "113 - MAL ALINHADO (MAL)",
  "088 - JOGO DIFERENTE (JD)",
  "090 - JOGO EXCESSIVO (JE)",
  "075 - RETRAIDO (ER)",
  "103 - JOGO INSUFICIENTE (JI)",
  "JOGO IRREGULAR",
  "213 - INTERFERÊNCIA OU TOQUE (TL)",
  "FLANGIATURA IRREGULAR",
  "CURSO IRREGULAR",
  "FORA DE ESQUADRO",
];

const getTodayDateString = () => format(new Date(), "yyyy-MM-dd");

const formatQuadrantName = (value) => {
  if (!value) return "N/A";
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};

const FilterBar = forwardRef(
  (
    {
      onFilterChange,
      selectedQuadrant,
      onSaveClick,
      isSaving,
      onDefeitoReset, // ← NOVA PROP
    },
    ref,
  ) => {
    // 1. ESTADOS DOS FILTROS
    const [date, setDate] = useState(getTodayDateString());
    const [turno, setTurno] = useState(turnos[0].value);
    const [modelo, setModelo] = useState(modelos[0]);
    const [defeito, setDefeito] = useState("");

    // Função para resetar o defeito (exposta via ref)
    const resetDefeito = () => {
      setDefeito("");
      // Notifica o pai sobre a mudança
      notifyChange(date, turno, modelo, "");
    };

    // Expoe a função resetDefeito para o componente pai via ref
    useImperativeHandle(ref, () => ({
      resetDefeito,
    }));

    // Função de notificação para o componente pai
    const notifyChange = (newDate, newTurno, newModelo, newDefeito) => {
      onFilterChange({
        date: newDate,
        turno: newTurno,
        modelo: newModelo,
        defeito: newDefeito,
      });
    };

    // Handlers
    const handleDateChange = (e) => {
      const newDate = e.target.value;
      setDate(newDate);
      notifyChange(newDate, turno, modelo, defeito);
    };

    const handleTurnoClick = (turnoValue) => {
      setTurno(turnoValue);
      notifyChange(date, turnoValue, modelo, defeito);
    };

    const handleModeloClick = (newModelo) => {
      setModelo(newModelo);
      setDefeito("");
      notifyChange(date, turno, newModelo, "");
    };

    const handleDefeitoChange = (e) => {
      const newDefeito = e.target.value;
      setDefeito(newDefeito);
      notifyChange(date, turno, modelo, newDefeito);
    };

    // Notifica a DefectsPage com os valores iniciais
    useEffect(() => {
      notifyChange(date, turno, modelo, "");
    }, []);

    return (
      <div className="filter-bar__container">
        {/* Seletor de Data */}
        <div className="filter-bar__group">
          <label className="filter-bar__label" htmlFor="date-selector">
            Data
          </label>
          <input
            id="date-selector"
            className="filter-bar__date-input"
            type="date"
            value={date}
            onChange={handleDateChange}
          />
        </div>

        {/* Seletor de Turno (Botões) */}
        <div className="filter-bar__group">
          <label className="filter-bar__label">Turno</label>
          <div className="filter-bar__shift-buttons">
            {turnos.map((t) => (
              <button
                key={t.value}
                className={`filter-bar__shift-button ${turno === t.value ? "filter-bar__shift-button--active" : ""}`}
                onClick={() => handleTurnoClick(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seletor de Modelo */}
        <div className="filter-bar__group filter-bar__group--modelos">
          <label className="filter-bar__label">Modelo</label>
          <div className="filter-bar__model-buttons">
            {modelos.map((m) => (
              <button
                key={m}
                className={`filter-bar__model-button ${modelo === m ? "filter-bar__model-button--active" : ""}`}
                onClick={() => handleModeloClick(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Quadrante Selecionado */}
        <div className="filter-bar__group filter-bar__group--quadrant">
          <label className="filter-bar__label">Quadrante Selecionado</label>
          <div
            className={`filter-bar__display-box ${
              selectedQuadrant ? "filter-bar__display-box--active" : ""
            }`}
          >
            {formatQuadrantName(selectedQuadrant)}
          </div>
        </div>

        {/* Defeito */}
        <div className="filter-bar__group filter-bar__defeito-wrapper">
          {selectedQuadrant ? (
            <>
              <label className="filter-bar__label">Defeito</label>
              <select
                className="filter-bar__select"
                value={defeito}
                onChange={handleDefeitoChange}
              >
                <option value="">Selecione...</option>
                {defeitos.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div className="filter-bar__defeito-placeholder"></div>
          )}
        </div>

        {/* BOTÃO SALVAR */}
        <div className="filter-bar__group filter-bar__save-button">
          <button
            className="save-button"
            onClick={onSaveClick}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    );
  },
);

FilterBar.displayName = "FilterBar"; // ← ADICIONA PARA DEBUG

export default FilterBar;

import React, { useState, useEffect, useMemo } from "react";
import { usePCMProgramacao } from "./hooks/usePCMProgramacao";
import Gantt from "../gantt/Gantt";

const PCMProgramacaoGantt = () => {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [semana, setSemana] = useState("");
  const [groupBy, setGroupBy] = useState("colaborador");
  const [filterLabel, setFilterLabel] = useState("");

  const { loading, error, data, fetchProgramacao } = usePCMProgramacao();

  useEffect(() => {
    fetchProgramacao(null, null);
  }, []);

  const handleBuscar = () => {
    if (!ano || !semana) {
      alert("Informe ano e semana");
      return;
    }
    fetchProgramacao(ano, semana);
  };

  const rows = useMemo(() => {
    if (!data) return [];
    const source =
      groupBy === "colaborador" ? data.byColaborador : data.byLinha;
    return source
      .map((row, index) => ({
        id: `${groupBy}-${index}`,
        label: row.label,
        disponibilidade: row.disponibilidade || [],
        atividades:
          row.atividades?.map((ativ) => ({
            ...ativ,
            subtitle:
              groupBy === "colaborador"
                ? `${ativ.linha} / ${ativ.maquina}`
                : ativ.colaborador,
          })) || [],
      }))
      .filter(
        (row) =>
          filterLabel === "" ||
          row.label.toLowerCase().includes(filterLabel.toLowerCase()),
      );
  }, [data, groupBy, filterLabel]);

  return (
    <>
      <div className="pcm-gantt-section__header">
        <h2 className="pcm-gantt-section__title">Programação fim de semana</h2>

        <div className="pcm-gantt-filters">
          <input
            className="pcm-gantt-filters__input"
            type="number"
            min={2025}
            max={2100}
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            placeholder="Ano"
          />
          <input
            className="pcm-gantt-filters__input"
            type="number"
            min={0}
            max={53}
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
            placeholder="Semana"
          />
          <select
            className="pcm-gantt-filters__select"
            value={groupBy}
            onChange={(e) => {
              setGroupBy(e.target.value);
              setFilterLabel("");
            }}
          >
            <option value="colaborador">Por Colaborador</option>
            <option value="linha">Por Linha</option>
          </select>
          <input
            className="pcm-gantt-filters__input"
            type="text"
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
            placeholder={
              groupBy === "colaborador"
                ? "Filtrar colaborador…"
                : "Filtrar linha…"
            }
            style={{ width: 180 }}
          />
          <button
            className="pcm-btn pcm-btn--primary"
            onClick={handleBuscar}
            disabled={loading}
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="pcm-feedback pcm-feedback--error">⚠ {error}</div>
      )}

      {loading && (
        <div className="pcm-state">
          <div className="pcm-state__spinner" />
          Carregando programação…
        </div>
      )}

      {data && rows.length > 0 && (
        <>
          <div className="pcm-gantt-meta">
            <span className="pcm-gantt-meta__badge">
              Semana {data.semana} / {data.ano}
            </span>
            <span className="pcm-gantt-meta__badge">
              {new Date(data.startDate).toLocaleDateString("pt-BR")}
              {" → "}
              {new Date(data.endDate).toLocaleDateString("pt-BR")}
            </span>
            <span className="pcm-gantt-meta__badge">
              {rows.length}{" "}
              {groupBy === "colaborador" ? "colaboradores" : "linhas"}
            </span>
          </div>

          <Gantt rows={rows} view={groupBy} />
        </>
      )}

      {data && rows.length === 0 && !loading && (
        <div className="pcm-state">
          Nenhum resultado encontrado para o filtro aplicado.
        </div>
      )}
    </>
  );
};

export default PCMProgramacaoGantt;

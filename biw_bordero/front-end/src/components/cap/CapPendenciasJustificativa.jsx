import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import "./styles/CapPendenciasJustificativa.css";
import { useNavigate } from "react-router-dom";

const CapPendenciasJustificativa = ({ dados = [] }) => {
  const [expandedUTE, setExpandedUTE] = useState({});
  const navigate = useNavigate();

  const goToJustificar = (line) => {
    navigate(`/cap/justificar/${line}`);
  };

  const safeDados = useMemo(() => (Array.isArray(dados) ? dados : []), [dados]);

  const toggleUTE = (ute) => {
    setExpandedUTE((prev) => ({
      ...prev,
      [ute]: !prev[ute],
    }));
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return (
      d.getHours().toString().padStart(2, "0") +
      ":" +
      d.getMinutes().toString().padStart(2, "0")
    );
  };

  /* Horários únicos (colunas) */
  const allTimes = useMemo(() => {
    return [...new Set(safeDados.map((i) => formatTime(i.ts_inicio)))].sort();
  }, [safeDados]);

  /*  MATRIZ: UTE -> LINE -> HORA */
  const matrix = useMemo(() => {
    const acc = {};

    safeDados.forEach((item) => {
      const ute = item.ute;
      const line = item.line;
      const time = formatTime(item.ts_inicio);

      if (!acc[ute]) acc[ute] = {};
      if (!acc[ute][line]) acc[ute][line] = {};

      acc[ute][line][time] = item;
    });

    return acc;
  }, [safeDados]);

  if (safeDados.length === 0) {
    return <p>Sem dados</p>;
  }

  return (
    <div className="pendjust-container">
      <div className="pendjust-wrapper">
        <h1 className="pendjust-title">Pendências de Justificativa</h1>

        <div className="pendjust-card">
          <table className="pendjust-table">
            <thead>
              <tr>
                <th className="ute-col">UTE / LINHA</th>
                {allTimes.map((t) => (
                  <th key={t} className="time-col">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Object.entries(matrix).map(([ute, lines]) => (
                <React.Fragment key={ute}>
                  {/* Linha UTE */}
                  <tr className="ute-row">
                    <td className="ute-cell">
                      <button
                        className="ute-toggle"
                        onClick={() => toggleUTE(ute)}
                      >
                        {expandedUTE[ute] ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                        UTE {ute}
                      </button>
                    </td>
                    {allTimes.map((t) => (
                      <td key={t}></td>
                    ))}
                  </tr>

                  {/* Linhas (LINE) */}
                  {expandedUTE[ute] &&
                    Object.entries(lines).map(([line, times]) => (
                      <tr
                        key={`${ute}-${line}`}
                        className="line-row clickable"
                        onClick={() => goToJustificar(line)}
                      >
                        <td className="line-cell">{line}</td>

                        {allTimes.map((t) => {
                          const item = times[t];

                          return (
                            <td key={t} className="time-cell">
                              {item && (
                                <div
                                  className={`status-box ${
                                    item.justificado
                                      ? "status-ok"
                                      : "status-pendente"
                                  }`}
                                  title={`Turno: ${item.turno}`}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legenda */}
        <div className="pendjust-legend">
          <div>
            <span className="legend-box status-ok"></span> Justificado
          </div>
          <div>
            <span className="legend-box status-pendente"></span> Pendente
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapPendenciasJustificativa;

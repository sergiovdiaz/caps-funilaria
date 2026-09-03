import React from "react";

const GanttTooltip = ({ tooltip, tooltipRef }) => {
  if (!tooltip?.item) return null;

  const { item, x, y } = tooltip;

  return (
    <div
      ref={tooltipRef}
      className="gantt-tooltip"
      style={{
        left: x + 12,
        top: y - 90,
      }}
    >
      {/* Header */}
      <div className="gantt-tooltip__header">
        <div className="gantt-tooltip__icon">
          {item.type === "disponibilidade" ? "📅" : "⚙️"}
        </div>

        <div className="gantt-tooltip__title">
          {item.type === "disponibilidade"
            ? "Disponibilidade"
            : item.atividade || "Atividade"}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="gantt-tooltip__content">
        {item?.maquina && (
          <div className="gantt-tooltip__field">
            <span className="gantt-tooltip__label">Máquina</span>
            <span className="gantt-tooltip__value">{item.maquina}</span>
          </div>
        )}

        {item?.tecnologia && (
          <div className="gantt-tooltip__field">
            <span className="gantt-tooltip__label">Tecnologia</span>
            <span className="gantt-tooltip__value">{item.tecnologia}</span>
          </div>
        )}

        <div className="gantt-tooltip__field gantt-tooltip__field--highlight">
          <span className="gantt-tooltip__label">Início</span>
          <span className="gantt-tooltip__value">
            {new Date(item.start).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="gantt-tooltip__field gantt-tooltip__field--highlight">
          <span className="gantt-tooltip__label">Fim</span>
          <span className="gantt-tooltip__value">
            {new Date(item.end).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Lista completa de colaboradores */}
        {item?.colaboradores && item.colaboradores.length > 0 && (
          <div className="gantt-tooltip__field gantt-tooltip__field--collaborators">
            <span className="gantt-tooltip__label">Colaboradores</span>

            <div className="gantt-tooltip__collaborators-list">
              {item.colaboradores.map((colaborador, index) => (
                <span key={index} className="gantt-tooltip__collaborator">
                  <span className="gantt-tooltip__collab-avatar">
                    {colaborador
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </span>

                  {colaborador}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Compatibilidade com colaborador único */}
        {item?.type === "atividade" &&
          item?.colaborador &&
          !item?.colaboradores && (
            <div className="gantt-tooltip__field">
              <span className="gantt-tooltip__label">Colaborador</span>
              <span className="gantt-tooltip__value">{item.colaborador}</span>
            </div>
          )}
      </div>

      {/* Duração */}
      <div className="gantt-tooltip__duration">
        Duração:{" "}
        {(() => {
          const diff = new Date(item.end) - new Date(item.start);
          const totalMinutes = Math.floor(diff / (1000 * 60));

          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        })()}
      </div>
    </div>
  );
};

export default GanttTooltip;

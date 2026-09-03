import React, { useMemo } from "react";

/**
 * Algoritmo de stacking para atividades sobrepostas.
 * Distribui em "lanes" (faixas verticais) dentro da row.
 */
function stackActivities(atividades) {
  const sorted = [...atividades].sort(
    (a, b) => new Date(a.start) - new Date(b.start),
  );

  const lanes = [];

  return sorted.map((item) => {
    const start = new Date(item.start);
    const end = new Date(item.end);

    let laneIdx = lanes.findIndex(
      (lane) => lane.length === 0 || new Date(lane[lane.length - 1]) <= start,
    );

    if (laneIdx === -1) {
      lanes.push([]);
      laneIdx = lanes.length - 1;
    }

    lanes[laneIdx].push(end.toISOString());

    return { ...item, _lane: laneIdx };
  });
}

const fmt = (d) =>
  new Date(d).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Função para gerar background da timeline
const getTimelineBackground = (view) => {
  if (view === "linha") {
    return "repeating-linear-gradient(-45deg, rgba(128,128,128,0.06), rgba(128,128,128,0.06) 5px, rgba(128,128,128,0.1) 5px, rgba(128,128,128,0.13) 10px)";
  }
  // padrão: vermelho
  return "repeating-linear-gradient(-45deg, rgba(220,38,38,0.06), rgba(220,38,38,0.06) 5px, rgba(220,38,38,0.09) 5px, rgba(220,38,38,0.1) 10px)";
};

const GanttRow = ({
  row,
  startDate,
  endDate,
  hourSlots,
  colorPalette,
  rowIndex,
  view,
  onItemEnter,
  onItemLeave,
}) => {
  const totalMs = endDate - startDate;

  const toPercent = (date) => ((new Date(date) - startDate) / totalMs) * 100;
  const widthPercent = (start, end) =>
    Math.max(((new Date(end) - new Date(start)) / totalMs) * 100, 0.15);

  const stackedActivities = useMemo(
    () => stackActivities(row.atividades || []),
    [row.atividades],
  );

  const totalLanes = Math.max(
    1,
    stackedActivities.reduce((acc, a) => Math.max(acc, a._lane + 1), 0),
  );

  const ITEM_H_PX = 60;
  const ITEM_GAP = 1;
  const rowHeight = Math.max(72, totalLanes * (ITEM_H_PX + ITEM_GAP) + 16);

  const initials = row.label
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  console.log(view);
  return (
    <div className="gantt-row" style={{ minHeight: rowHeight }}>
      {/* Label */}
      <div className="gantt-row__label" title={row.label}>
        {view == "colaborador" && (
          <div className="gantt-row__label-avatar">{initials}</div>
        )}
        <div className="gantt-row__label-text">{row.label}</div>
      </div>

      {/* Timeline */}
      <div
        className="gantt-row__timeline"
        style={{
          minHeight: rowHeight,
          background: getTimelineBackground(view),
        }}
      >
        {/* Grid lines por hora */}
        {hourSlots.map((h, i) => (
          <div
            key={i}
            className="gantt-row__grid-line"
            style={{ left: `${toPercent(h)}%` }}
          />
        ))}

        {/* Disponibilidade */}
        {row.disponibilidade?.map((d, i) => {
          const left = toPercent(d.start);
          const width = widthPercent(d.start, d.end);
          if (left < 0 || left > 100) return null;
          return (
            <div
              key={i}
              className="gantt-item--disponibilidade"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {/* Atividades */}
        <div className="gantt-activities-layer">
          {stackedActivities.map((item, i) => {
            const left = toPercent(item.start);
            const width = widthPercent(item.start, item.end);
            if (left < 0 || width <= 0) return null;

            const laneTop = 8 + item._lane * (ITEM_H_PX + ITEM_GAP);

            return (
              <div
                key={i}
                className="gantt-item gantt-item--atividade"
                tabIndex={0}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: laneTop,
                  height: ITEM_H_PX,
                }}
                onMouseEnter={(e) => onItemEnter(item, e)}
                onMouseLeave={onItemLeave}
                onFocus={(e) => onItemEnter(item, e)}
                onBlur={onItemLeave}
              >
                <div className="gantt-item__title">{item.atividade}</div>
                {item.maquina && (
                  <div className="gantt-item__subtitle">{item.maquina}</div>
                )}
                {width > 5 && (
                  <div className="gantt-item__time">
                    {fmt(item.start)} – {fmt(item.end)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(GanttRow);

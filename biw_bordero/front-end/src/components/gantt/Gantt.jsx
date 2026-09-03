// import "./styles/Gantt.css";
import { useMemo, useState, useRef, useCallback } from "react";
import GanttTooltip from "./GanttTooltip";
import GanttRow from "./GanttRow";

const COLORS = ["#283f90"];

export default function Gantt({ rows, view }) {
  const [tooltip, setTooltip] = useState(null);
  const tooltipRef = useRef(null);

  const { startDate, endDate, hourSlots } = useMemo(() => {
    let min = null;
    let max = null;

    rows.forEach((row) => {
      [...(row.disponibilidade || []), ...(row.atividades || [])].forEach(
        (i) => {
          const start = new Date(i.start);
          const end = new Date(i.end);

          if (!min || start < min) min = start;
          if (!max || end > max) max = end;
        },
      );
    });

    if (!min || !max) {
      return { startDate: null, endDate: null, hourSlots: [] };
    }

    min.setMinutes(0, 0, 0);
    max.setMinutes(0, 0, 0);
    max.setHours(max.getHours() + 1);

    const totalHours = Math.ceil((max - min) / (1000 * 60 * 60));

    const slots = Array.from({ length: totalHours }, (_, i) => {
      const d = new Date(min);
      d.setHours(d.getHours() + i);
      return d;
    });

    return { startDate: min, endDate: max, hourSlots: slots };
  }, [rows]);

  const tooltipActiveRef = useRef(false);

  const handleMouseEnter = useCallback((item, e) => {
    if (!item) return;

    tooltipActiveRef.current = true;

    setTooltip({
      item,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!tooltipActiveRef.current) return;

    setTooltip((t) => ({
      ...t,
      x: e.clientX,
      y: e.clientY,
    }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    tooltipActiveRef.current = false;
    setTooltip(null);
  }, []);

  if (!startDate || !endDate) return null;

  // Group hours by date for merged date header cells
  const dateGroups = [];
  hourSlots.forEach((h) => {
    const label = h.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
    const last = dateGroups[dateGroups.length - 1];
    if (last && last.label === label) {
      last.span++;
    } else {
      dateGroups.push({ label, span: 1 });
    }
  });

  // const nowPosition = useMemo(() => {
  //   if (!startDate || !endDate) return null;
  //   const now = new Date();
  //   if (now < startDate || now > endDate) return null;
  //   const total = endDate - startDate;
  //   const elapsed = now - startDate;
  //   return (elapsed / total) * 100;
  // }, [startDate, endDate]);

  // const nowPosition = useMemo(() => {
  //   if (!startDate || !endDate) return null;
  //   const now = new Date("2026-02-22T07:30:00-03:00");
  //   if (now < startDate || now > endDate) return null;
  //   const total = endDate - startDate;
  //   const elapsed = now - startDate;
  //   return (elapsed / total) * 100;
  // }, [startDate, endDate]);

  const nowPosition = useMemo(() => {
    return null;
  }, [startDate, endDate]);

  return (
    <div className="gantt-wrapper" onMouseMove={handleMouseMove}>
      {/* Legend */}
      {view === "colaborador" && (
        <div className="gantt-legend">
          <div className="gantt-legend__item">
            <span className="gantt-legend__dot gantt-legend__dot--avail" />
            Disponível
          </div>
          <div className="gantt-legend__item">
            <span className="gantt-legend__dot gantt-legend__dot--busy" />
            Fora de disponibilidade
          </div>
          <div className="gantt-legend__item">
            <span className="gantt-legend__dot gantt-legend__dot--activity" />
            Atividade programada
          </div>
        </div>
      )}
      <div className="gantt-scroll">
        <div className="gantt-inner">
          {/* Header */}
          <div className="gantt__header">
            <div className="gantt__header-label">
              {view === "colaborador" ? "Colaborador" : "Linha"}
            </div>
            <div className="gantt__header-timeline">
              {/* Row 1: dates */}
              <div className="gantt__header-dates">
                {dateGroups.map((g, i) => (
                  <div
                    key={i}
                    className="gantt__date-cell"
                    style={{ flex: g.span }}
                  >
                    {g.label}
                  </div>
                ))}
              </div>
              {/* Row 2: hours */}
              <div className="gantt__header-hours">
                {hourSlots.map((h, i) => (
                  <div key={i} className="gantt__hour-cell">
                    {h.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                ))}
                {nowPosition !== null && (
                  <div
                    className="gantt__now-label"
                    style={{ left: `${nowPosition}%` }}
                  >
                    {" "}
                    AGORA{" "}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="gantt__body-wrapper">
            <div className="gantt__body">
              {rows.map((row, ri) => (
                <GanttRow
                  key={row.id ?? ri}
                  row={row}
                  startDate={startDate}
                  endDate={endDate}
                  hourSlots={hourSlots}
                  colorPalette={COLORS}
                  rowIndex={ri}
                  view={view}
                  onItemEnter={handleMouseEnter}
                  onItemLeave={handleMouseLeave}
                />
              ))}
            </div>
            {nowPosition !== null && (
              <div
                className="gantt__now-line"
                style={{ left: `${nowPosition}%` }}
              ></div>
            )}
          </div>
        </div>
      </div>

      <GanttTooltip tooltip={tooltip} tooltipRef={tooltipRef} />
    </div>
  );
}

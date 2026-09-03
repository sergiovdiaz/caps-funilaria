import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { getValueColor } from "./tcColorUtils.js";
import { getContrastTextColor } from "./utils/getContrastTextColor.js";

const INTERVAL_MS = 10000;
const FIXED_COL_WIDTH = 160; // px — largura da coluna "Métrica / ST"
const MIN_COL_WIDTH = 80; // px — largura mínima de cada coluna de estação

function OperationsTable({ operations = [], linestatus = {} }) {
  const containerRef = useRef(null);
  const [pageSize, setPageSize] = useState(8); // fallback inicial
  const [page, setPage] = useState(0);

  /* ── Mapeia station → cor hex ── */
  const stationColors = useMemo(() => {
    if (!linestatus?.stations) return {};
    const map = {};
    Object.values(linestatus.stations).forEach((st) => {
      if (st.station && st.color_hex) map[st.station] = st.color_hex;
    });
    return map;
  }, [linestatus]);

  console.log(linestatus);
  /* ── Calcula quantas colunas cabem no container ── */
  const calcPageSize = useCallback(() => {
    if (!containerRef.current) return;
    const totalWidth = containerRef.current.offsetWidth;
    const available = totalWidth - FIXED_COL_WIDTH;
    const cols = Math.max(1, Math.floor(available / MIN_COL_WIDTH));
    setPageSize(cols);
  }, []);

  /* ── Recalcula ao montar e quando a janela redimensionar ── */
  useEffect(() => {
    calcPageSize();

    // ResizeObserver para pegar mudanças no próprio container
    // (funciona melhor que window.resize para layouts flex/grid)
    const ro = new ResizeObserver(calcPageSize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, [calcPageSize]);

  /* ── Reseta a página quando o pageSize ou os dados mudarem ── */
  useEffect(() => {
    setPage(0);
  }, [pageSize, operations.length]);

  const totalPages = Math.ceil(operations.length / pageSize);

  /* ── Auto-avança a página ── */
  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [totalPages]);

  const pagedOperations = useMemo(() => {
    const start = page * pageSize;
    return operations.slice(start, start + pageSize);
  }, [operations, page, pageSize]);

  const metricLabels = useMemo(
    () => [
      { key: "average", label: "TC médio do turno" },
      { key: "last", label: "Último TC" },
      { key: "totalCount", label: "Qtde TC Coletados" },
      { key: "outPercentage", label: "% TC Fora do Target" },
      { key: "outAverage", label: "TC Médio Fora do Target" },
    ],
    [],
  );

  return (
    <div className="cardandon card--operations" ref={containerRef}>
      <div className="operationtable__container">
        <table className="operations__table">
          <thead>
            <tr>
              <th className="operationtable__header-fixed">Métrica / ST</th>
              {pagedOperations.map((m) => {
                const stationInfo = Object.values(
                  linestatus?.stations || {},
                ).find((st) => st.station === m.st);

                return (
                  <th
                    key={m.st}
                    title={
                      stationInfo
                        ? `${stationInfo.andondesc}: ${stationInfo.alarm}`
                        : undefined
                    }
                    className="operationtable__header"
                    style={
                      stationColors[m.st]
                        ? {
                            backgroundColor: stationColors[m.st],
                            color: getContrastTextColor(stationColors[m.st]),
                          }
                        : undefined
                    }
                  >
                    {m.st}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {metricLabels.map((metric) => (
              <tr key={metric.key}>
                <td className="operationtable__cell-fixed">{metric.label}</td>

                {pagedOperations.map((m) => {
                  const rawValue = m[metric.key];
                  let displayValue = "-";

                  if (rawValue !== null && rawValue !== undefined) {
                    if (metric.key === "average" || metric.key === "outAverage")
                      displayValue = Number(rawValue).toFixed(1);
                    else if (metric.key === "outPercentage")
                      displayValue = Number(rawValue).toFixed(1) + "%";
                    else displayValue = rawValue;
                  }

                  return (
                    <td
                      key={`${metric.key}-${m.st}`}
                      className="operationtable__cell"
                    >
                      <div
                        className={`operationcell__value ${getValueColor(
                          rawValue,
                          metric.key,
                          operations,
                        )}`}
                      >
                        {displayValue}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Indicador de página — aparece só quando há mais de 1 página */}
      {totalPages > 1 && (
        <div className="operationtable__pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`operationtable__page-dot${i === page ? " operationtable__page-dot--active" : ""}`}
              onClick={() => setPage(i)}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(OperationsTable);

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import "./styles/CapTable.css";
import clearFilterIcon from "../../assets/images/clear-filter.png";
import { formatMinutesToHHMMSS } from "./utils/capUtils";
import Tooltip from "../common/Tooltip";

const LoadingSpinner = () => (
  <div className="cap-table__loading">
    <span>Carregando dados...</span>
  </div>
);

const CapTable = ({
  hour,
  data = [], // Valor padrão para evitar erros
  onSelectionChange,
  selectedRows = [],
  onClearSelections,
  onPendingChange,
  isLoading = false,
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: "losstime_min",
    direction: "desc",
  });
  const tableRef = useRef(null);

  const [manualMode, setManualMode] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");

  // Sincroniza selectedRows do pai
  useEffect(() => {
    if (selectedRows && selectedRows.length > 0) {
      const ids = selectedRows.map((row) => row.id || row);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  }, [selectedRows]);

  // Notifica o pai sobre mudanças pendentes
  useEffect(() => {
    if (onPendingChange) {
      onPendingChange(selectedIds.length > 0);
    }
  }, [selectedIds, onPendingChange]);

  // ---- FILTRO + ORDENAÇÃO ----
  const filteredAndSortedData = useMemo(() => {
    let filtered = Array.isArray(data) ? data : [];

    // Filtragem
    Object.keys(filters).forEach((key) => {
      if (!filters[key]) return;
      filtered = filtered.filter((row) => {
        if (!row || row[key] === undefined || row[key] === null) return false;
        return String(row[key])
          .toLowerCase()
          .includes(filters[key].toLowerCase());
      });
    });

    // Ordenação
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filters, sortConfig]);

  // ---- RANGE SELECTION ----
  const selectRange = useCallback(
    (startIdx, endIdx) => {
      const start = Math.min(startIdx, endIdx);
      const end = Math.max(startIdx, endIdx);

      const rangeIds = [];
      for (let i = start; i <= end; i++) {
        const row = filteredAndSortedData[i];
        if (row && !row.is_used) {
          rangeIds.push(row.id);
        }
      }

      setSelectedIds((prev) => {
        const combined = Array.from(new Set([...prev, ...rangeIds]));
        const rowsFinal = data.filter((r) => r && combined.includes(r.id));
        onSelectionChange?.(rowsFinal);
        return combined;
      });
    },
    [filteredAndSortedData, data, onSelectionChange],
  );

  // ---- TOGGLE ROW SELECTION ----
  const toggleRowSelection = useCallback(
    (idx, isRangeSelection = false) => {
      const row = filteredAndSortedData[idx];
      if (!row || row.is_used) return;

      // SHIFT/RANGE
      if (isRangeSelection && selectionStart !== null) {
        selectRange(selectionStart, idx);
        return;
      }

      // Clique normal
      setSelectedIds((prev) => {
        const isSelected = prev.includes(row.id);
        const updated = isSelected
          ? prev.filter((id) => id !== row.id)
          : [...prev, row.id];

        const rowsFinal = data.filter(
          (item) => item && updated.includes(item.id),
        );
        onSelectionChange?.(rowsFinal);
        return updated;
      });

      setSelectionStart(idx);
    },
    [
      filteredAndSortedData,
      data,
      onSelectionChange,
      selectionStart,
      selectRange,
    ],
  );

  // ---- DRAG SELECTION ----
  const handleMouseDown = useCallback((idx, e) => {
    if (e.shiftKey) return;
    setIsSelecting(true);
    setSelectionStart(idx);
    setSelectionEnd(idx);
  }, []);

  const handleMouseEnter = useCallback(
    (idx) => {
      if (isSelecting && selectionStart !== null) {
        setSelectionEnd(idx);
        selectRange(selectionStart, idx);
      }
    },
    [isSelecting, selectionStart, selectRange],
  );

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  useEffect(() => {
    const fn = () => isSelecting && handleMouseUp();
    document.addEventListener("mouseup", fn);
    return () => document.removeEventListener("mouseup", fn);
  }, [isSelecting, handleMouseUp]);

  const formatDateRecife = (isoString) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return "-";
    }
  };

  const selectedRowsCount = selectedIds.length;

  if (isLoading) {
    return (
      <div className="cap-table__container">
        <header className="cap-table__header">
          <h3 className="cap__title">
            {hour
              ? `Eventos entre ${hour}`
              : "⚠️ Selecione uma hora no gráfico para justificar"}
          </h3>
        </header>
        <LoadingSpinner />
      </div>
    );
  }

  // useEffect(() => {
  //   if (manualMode && manualMinutes) {
  //     onSelectionChange?.([
  //       {
  //         id: "manual",
  //         losstime_min: Number(manualMinutes),
  //         isManual: true,
  //       },
  //     ]);
  //   }
  // }, [manualMode, manualMinutes]);

  return (
    <div className="cap-table__container">
      <button
        className="cap-table__clear-filters-btn"
        title="Limpar filtros"
        onClick={() => {
          setFilters({});
          setSortConfig({ key: "", direction: "asc" });
        }}
      >
        <img src={clearFilterIcon} alt="Limpar filtros" />
      </button>

      <header className="cap-table__header">
        <h3 className="cap__title">
          {hour
            ? `Eventos entre ${hour}`
            : "⚠️ Selecione uma hora no gráfico para justificar"}
        </h3>

        <div className="cap-table__actions">
          {selectedRowsCount > 0 && (
            <>
              <span className="cap-table__selection-count">
                {selectedRowsCount} evento(s)
              </span>
              <button
                className="cap-table__clear-btn"
                onClick={() => {
                  setSelectedIds([]);
                  onClearSelections?.();
                }}
              >
                Limpar seleção
              </button>
            </>
          )}
          {/* NOVO BLOCO */}
          {/* <div className="cap-table__manual">
            {!manualMode ? (
              <button
                className="cap-table__manual-btn"
                onClick={() => {
                  setManualMode(true);
                  setSelectedIds([]); // limpa seleção pq agora é manual
                  onClearSelections?.();
                }}
              >
                Não encontrou o alarme?
              </button>
            ) : (
              <div className="cap-table__manual-input">
                <input
                  type="number"
                  placeholder="Minutos"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                />
                <button
                  onClick={() => {
                    setManualMode(false);
                    setManualMinutes("");
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div> */}
        </div>
      </header>

      <div
        className={`cap-table__wrapper ${
          isSelecting ? "cap-table__wrapper--selecting" : ""
        }`}
      >
        <table className="cap-table" ref={tableRef}>
          <thead>
            <tr>
              <th className="cap-table__cell--checkbox">✓</th>

              {[
                { key: "line", label: "Linha", filter: true },
                { key: "station", label: "Estação", filter: true },
                { key: "element", label: "Máquina", filter: true },
                { key: "alarm", label: "Alarme", filter: true },
                { key: "priority", label: "Tipo", filter: true },
                { key: "losstime_min", label: "Duração (horas)", filter: true },
                {
                  key: "qtd_ocorrencias",
                  label: "Qtd. Ocorrências",
                  filter: true,
                },
              ].map((col) => (
                <th key={col.key}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {col.label}

                    <button
                      onClick={() =>
                        setSortConfig((prev) => ({
                          key: col.key,
                          direction:
                            prev.key === col.key && prev.direction === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {sortConfig.key === col.key
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </button>
                  </div>

                  {col.filter && (
                    <input
                      type="text"
                      placeholder="Filtrar..."
                      value={filters[col.key] || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [col.key]: e.target.value,
                        }))
                      }
                      style={{ width: "90%" }}
                    />
                  )}
                </th>
              ))}

              {[
                { key: "start_time", label: "Início" },
                { key: "end_time", label: "Fim" },
              ].map((col) => (
                <th key={col.key}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {col.label}
                    <button
                      onClick={() =>
                        setSortConfig((prev) => ({
                          key: col.key,
                          direction:
                            prev.key === col.key && prev.direction === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {sortConfig.key === col.key
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredAndSortedData.map((row, idx) => {
              if (!row) return null;

              const isSelected = selectedIds.includes(row.id);
              const isDisabled = row.is_used === true;
              const isInRange =
                isSelecting &&
                selectionStart !== null &&
                selectionEnd !== null &&
                idx >= Math.min(selectionStart, selectionEnd) &&
                idx <= Math.max(selectionStart, selectionEnd);

              return (
                <Tooltip
                  key={row.id || idx}
                  text="Este alarme já foi justificado"
                  disabled={isDisabled}
                >
                  <tr
                    className={[
                      isSelected ? "cap-table__row--selected" : "",
                      isInRange ? "cap-table__row--selecting" : "",
                      isDisabled ? "cap-table__row--disabled" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(e) => {
                      if (isDisabled) return;
                      e.shiftKey
                        ? toggleRowSelection(idx, true)
                        : toggleRowSelection(idx);
                    }}
                    onMouseDown={(e) => {
                      if (isDisabled) return;
                      handleMouseDown(idx, e);
                    }}
                    onMouseEnter={() => {
                      if (isDisabled) return;
                      handleMouseEnter(idx);
                    }}
                    onMouseUp={() => {
                      if (isDisabled) return;
                      handleMouseUp();
                    }}
                  >
                    <td className="cap-table__cell--checkbox">
                      <div className="cap-table__checkbox">
                        {isSelected ? "✔" : ""}
                      </div>
                    </td>

                    <td>{row.line || "-"}</td>
                    <td>{row.station || "-"}</td>
                    <td>{row.element || "-"}</td>
                    <td>{row.alarm || "-"}</td>
                    <td>{row.priority || "-"}</td>
                    <td>{formatMinutesToHHMMSS(row.losstime_min)}</td>
                    <td>{row.qtd_ocorrencias || "0"}</td>
                    <td>{formatDateRecife(row.start_time)}</td>
                    <td>{formatDateRecife(row.end_time)}</td>
                  </tr>
                </Tooltip>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CapTable;

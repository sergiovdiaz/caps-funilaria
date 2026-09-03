import React, { useState, useMemo, useEffect } from "react";
import "./styles/LossesTable.css";

const formatDateRecife = (date) =>
  date ? new Date(date).toLocaleString("pt-BR") : "Em andamento";

const formatDurationMMSS = (seconds) => {
  if (seconds == null) return "-";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const mm = String(min).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return `${mm}:${ss}`;
};

const LossesTable = ({ data }) => {
  if (!Array.isArray(data)) {
    return (
      <div className="losses-container">
        <p>Nenhum dado disponível.</p>
      </div>
    );
  }
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [groupBy, setGroupBy] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupSortDirection, setGroupSortDirection] = useState("desc");

  // Obtém valores únicos de status para o dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    data.forEach((row) => {
      if (row.status) statuses.add(row.status);
    });
    return Array.from(statuses).sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let temp = [...data];

    Object.keys(filters).forEach((key) => {
      const value = filters[key]?.toLowerCase() || "";
      if (value) {
        temp = temp.filter((row) =>
          (row[key] || "").toString().toLowerCase().includes(value)
        );
      }
    });

    if (sortConfig.key) {
      temp.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        } else {
          return sortConfig.direction === "asc"
            ? aValue.toString().localeCompare(bValue.toString())
            : bValue.toString().localeCompare(aValue.toString());
        }
      });
    }

    return temp;
  }, [data, filters, sortConfig]);

  const getSecondaryGroup = () => {
    if (groupBy === "station") return "element";
    if (groupBy === "status") return "element";
    return null;
  };

  const groupedData = useMemo(() => {
    if (!groupBy) return null;

    const secondaryGroup = getSecondaryGroup();
    const groups = {};

    filteredAndSortedData.forEach((row) => {
      const primaryKey = row[groupBy] || "Sem classificação";
      const secondaryKey = secondaryGroup
        ? row[secondaryGroup] || "Sem classificação"
        : null;

      if (!groups[primaryKey]) {
        groups[primaryKey] = {
          totalDuration: 0,
          children: {},
        };
      }

      if (secondaryGroup) {
        if (!groups[primaryKey].children[secondaryKey]) {
          groups[primaryKey].children[secondaryKey] = {
            totalDuration: 0,
            alarms: {},
          };
        }

        const alarm = row.alarm || "Sem alarme";
        groups[primaryKey].children[secondaryKey].alarms[alarm] =
          (groups[primaryKey].children[secondaryKey].alarms[alarm] || 0) +
          (row.losstime || 0);

        groups[primaryKey].children[secondaryKey].totalDuration +=
          row.losstime || 0;
        groups[primaryKey].totalDuration += row.losstime || 0;
      } else {
        // Agrupamento simples (máquina)
        const alarm = row.alarm || "Sem alarme";
        if (!groups[primaryKey].alarms) {
          groups[primaryKey].alarms = {};
        }

        groups[primaryKey].alarms[alarm] =
          (groups[primaryKey].alarms[alarm] || 0) + (row.losstime || 0);

        groups[primaryKey].totalDuration += row.losstime || 0;
      }
    });

    return groups;
  }, [filteredAndSortedData, groupBy]);

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const columns = [
    { key: "line", label: "Linha", filter: true },
    { key: "station", label: "Estação", filter: true },
    { key: "element", label: "Máquina", filter: true },
    { key: "component", label: "Componente", filter: true },
    { key: "status", label: "Status", filter: true },
    { key: "alarm", label: "Alarme", filter: true },
    { key: "losstime", label: "Duração (min)", filter: true },
    { key: "start_time", label: "Início" },
    { key: "end_time", label: "Fim" },
  ];

  const getGroupLabel = () => {
    if (groupBy === "station") return "Estação";
    if (groupBy === "element") return "Máquina";
    if (groupBy === "status") return "Status";
    return "";
  };

  useEffect(() => {
    setExpandedGroups({});
  }, [groupBy]);

  return (
    <div className="losses-container">
      <div className="losses-toolbar">
        <label className="losses-toolbar__label">Agrupar por:</label>

        <button
          onClick={() => setGroupBy("")}
          className={`losses-btn ${groupBy === "" ? "losses-btn--active" : ""}`}
        >
          Sem agrupamento
        </button>
        <button
          onClick={() => setGroupBy("station")}
          className={`losses-btn ${groupBy === "station" ? "losses-btn--active" : ""}`}
        >
          Estação
        </button>
        <button
          onClick={() => setGroupBy("element")}
          className={`losses-btn ${groupBy === "element" ? "losses-btn--active" : ""}`}
        >
          Máquina
        </button>
        <button
          onClick={() => setGroupBy("status")}
          className={`losses-btn ${groupBy === "status" ? "losses-btn--active" : ""}`}
        >
          Status
        </button>

        {/* 🔹 FILTRO GLOBAL DE STATUS */}
        <div className="losses-toolbar__filter">
          <label>Status:</label>
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
              }))
            }
            className="losses-filter-select"
          >
            <option value="">Todos</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="losses-table-wrapper">
        <table className="losses-table">
          <thead className="losses-table__head">
            <tr>
              {groupBy && (
                <th className="losses-table__cell losses-table__cell--toggle">
                  +/-
                </th>
              )}
              {!groupBy ? (
                columns.map((col) => (
                  <th
                    key={col.key}
                    className="losses-table__cell losses-table__cell--header"
                  >
                    <div className="losses-header">
                      <span className="losses-header__label">{col.label}</span>
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
                        className="losses-sort-btn"
                      >
                        {sortConfig.key === col.key
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </button>
                    </div>

                    {col.filter &&
                      (col.key === "status" ? (
                        <select
                          value={filters.status || ""}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="losses-filter-select"
                        >
                          <option value="">Todos</option>
                          {uniqueStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
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
                          className="losses-filter-input"
                        />
                      ))}
                  </th>
                ))
              ) : (
                <>
                  <th className="losses-table__cell losses-table__cell--header">
                    <span className="losses-header__label">
                      {getGroupLabel()}
                    </span>
                  </th>
                  <th className="losses-table__cell losses-table__cell--header">
                    <div className="losses-header">
                      <span className="losses-header__label">
                        Duração Total
                      </span>
                      <button
                        onClick={() =>
                          setGroupSortDirection((prev) =>
                            prev === "desc" ? "asc" : "desc"
                          )
                        }
                        className="losses-sort-btn"
                      >
                        {groupSortDirection === "desc" ? "↓" : "↑"}
                      </button>
                    </div>
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="losses-table__body">
            {!groupBy
              ? filteredAndSortedData.map((row, idx) => (
                  <tr key={idx} className="losses-table__row">
                    <td>{row.line || "-"}</td>
                    <td>{row.station || "-"}</td>
                    <td>{row.element || "-"}</td>
                    <td>{row.component || "-"}</td>
                    <td>{row.status || "-"}</td>
                    <td>{row.alarm || "-"}</td>
                    <td>{formatDurationMMSS(row.losstime)}</td>
                    <td>{formatDateRecife(row.start_time)}</td>
                    <td>{formatDateRecife(row.end_time)}</td>
                  </tr>
                ))
              : Object.entries(groupedData)
                  .sort(([, a], [, b]) => b.totalDuration - a.totalDuration)
                  .map(([groupName, group]) => (
                    <React.Fragment key={groupName}>
                      {/* 🔹 GRUPO PRINCIPAL */}
                      <tr
                        className="losses-group-row"
                        onClick={() => toggleGroup(groupName)}
                      >
                        <td>{expandedGroups[groupName] ? "−" : "+"}</td>
                        <td>{groupName}</td>
                        <td>
                          <strong>
                            {formatDurationMMSS(group.totalDuration)}
                          </strong>
                        </td>
                      </tr>

                      {/* 🔹 CASO 1: AGRUPAMENTO POR MÁQUINA */}
                      {expandedGroups[groupName] &&
                        groupBy === "element" &&
                        Object.entries(group.alarms || {}).map(
                          ([alarmName, duration]) => (
                            <tr
                              key={`${groupName}-${alarmName}`}
                              className="losses-table__row losses-table__row--nested"
                            >
                              <td></td>
                              <td>{alarmName}</td>
                              <td>{formatDurationMMSS(duration)}</td>
                            </tr>
                          )
                        )}

                      {/* 🔹 CASO 2: ESTAÇÃO ou STATUS → MÁQUINA */}
                      {expandedGroups[groupName] &&
                        groupBy !== "element" &&
                        Object.entries(group.children || {}).map(
                          ([machineName, machine]) => (
                            <React.Fragment key={machineName}>
                              <tr className="losses-subgroup-row">
                                <td></td>
                                <td>Máquina: {machineName}</td>
                                <td>
                                  <strong>
                                    {formatDurationMMSS(machine.totalDuration)}
                                  </strong>
                                </td>
                              </tr>

                              {Object.entries(machine.alarms).map(
                                ([alarmName, duration]) => (
                                  <tr
                                    key={`${groupName}-${machineName}-${alarmName}`}
                                    className="losses-table__row losses-table__row--nested"
                                  >
                                    <td></td>
                                    <td>{alarmName}</td>
                                    <td>{formatDurationMMSS(duration)}</td>
                                  </tr>
                                )
                              )}
                            </React.Fragment>
                          )
                        )}
                    </React.Fragment>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LossesTable;

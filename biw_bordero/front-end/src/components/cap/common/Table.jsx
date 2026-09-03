import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./styles/Table.css";
import { exportToExcel } from "../../common/utils/exportToExcel";
import LoadingSpinner from "../../common/LoadingSpinner";

// const LoadingSpinner = () => (
//   <div className="generic-table__loading">
//     <span>Carregando dados...</span>
//   </div>
// );

const Table = ({
  title = "Tabela de Dados",
  data = [],
  columns = [],
  isLoading = false,
  onRowClick = null,
  emptyMessage = "Nenhum dado encontrado",
  initialSortColumn = null,
  initialSortDirection = "asc",
  enableGlobalSearch = true,
  itemsPerPage = 10,
  showPagination = true,
}) => {
  // console.log(data);
  // console.log(data);
  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: initialSortColumn,
    direction: initialSortDirection,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Extrai todas as colunas disponíveis dos dados se columns não for fornecido
  const availableColumns = useMemo(() => {
    if (columns.length > 0) return columns;

    if (!data || data.length === 0) return [];

    // Pega todas as chaves do primeiro objeto de dados
    const firstRow = data[0];
    return Object.keys(firstRow).map((key) => ({
      key: key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      filterable: true,
      sortable: true,
      formatter: null,
    }));
  }, [data, columns]);

  // Filtragem e ordenação
  const filteredAndSortedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    let filtered = [...data];

    // Filtro global
    if (enableGlobalSearch && globalSearch.trim()) {
      const searchTerm = globalSearch.toLowerCase();
      filtered = filtered.filter((row) => {
        return Object.values(row).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }

    // Filtros por coluna
    Object.keys(filters).forEach((key) => {
      if (!filters[key]) return;

      filtered = filtered.filter((row) => {
        const value = row[key];
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(filters[key].toLowerCase());
      });
    });

    // Ordenação
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const aNum = Number(aVal);
        const bNum = Number(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        }

        if (aVal instanceof Date && bVal instanceof Date) {
          return sortConfig.direction === "asc"
            ? aVal.getTime() - bVal.getTime()
            : bVal.getTime() - aVal.getTime();
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filters, sortConfig, globalSearch, enableGlobalSearch]);

  // Paginação
  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredAndSortedData;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage, itemsPerPage, showPagination]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  // Resetar página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, globalSearch, sortConfig]);

  const handleSort = (key) => {
    const column = availableColumns.find((col) => col.key === key);
    if (!column || !column.sortable) return;

    setSortConfig((prev) => ({
      key: key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearAllFilters = () => {
    setFilters({});
    setGlobalSearch("");
    setSortConfig({ key: initialSortColumn, direction: initialSortDirection });
  };

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return "-";

    if (column.formatter && typeof column.formatter === "function") {
      return column.formatter(value);
    }

    // Formatação automática para datas
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (e) {
        return value;
      }
    }

    return value;
  };

  if (isLoading) {
    return (
      <div className="generic-table__container">
        <header className="generic-table__header">
          <h3 className="generic-table__title">{title}</h3>
        </header>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="generic-table__container">
      <div className="generic-table__toolbar">
        <header className="generic-table__header">
          <h2 className="generic-table__title">{title}</h2>
          <div className="generic-table__badge">
            {filteredAndSortedData.length} registro(s)
          </div>
        </header>

        <div className="generic-table__controls">
          {enableGlobalSearch && (
            <div className="generic-table__global-search">
              <input
                type="text"
                placeholder="Buscar em todos os campos..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="generic-table__search-input"
              />
            </div>
          )}

          <button
            className="generic-table__clear-filters-btn"
            onClick={clearAllFilters}
          >
            Limpar filtros
          </button>
          <button
            className="generic-table__export-btn"
            onClick={() =>
              exportToExcel({
                data: filteredAndSortedData,
                columns: availableColumns,
                fileName: title,
              })
            }
          >
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="generic-table__wrapper">
        <table className="generic-table">
          <thead>
            <tr>
              {availableColumns.map((col) => (
                <th key={col.key}>
                  <div className="generic-table__header-content">
                    <span className="generic-table__header-label">
                      {col.label}
                    </span>

                    {col.sortable && (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="generic-table__sort-btn"
                      >
                        {sortConfig.key === col.key
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </button>
                    )}
                  </div>

                  {col.filterable && (
                    <input
                      type="text"
                      placeholder={`Filtrar ${col.label.toLowerCase()}...`}
                      value={filters[col.key] || ""}
                      onChange={(e) =>
                        handleFilterChange(col.key, e.target.value)
                      }
                      className="generic-table__filter-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={availableColumns.length}
                  className="generic-table__empty"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row, idx)}
                  className={onRowClick ? "generic-table__row--clickable" : ""}
                >
                  {availableColumns.map((col) => {
                    const colorVariant =
                      typeof col.colorMap === "function"
                        ? col.colorMap(row[col.key])
                        : col.colorMap?.[String(row[col.key])?.toLowerCase()];
                    return (
                      <td
                        key={col.key}
                        className={
                          colorVariant
                            ? `generic-table__cell--${colorVariant}`
                            : ""
                        }
                      >
                        {formatValue(row[col.key], col)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="generic-table__pagination">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="generic-table__pagination-btn"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="generic-table__pagination-btn"
          >
            ‹
          </button>

          <span className="generic-table__pagination-info">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="generic-table__pagination-btn"
          >
            ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="generic-table__pagination-btn"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;

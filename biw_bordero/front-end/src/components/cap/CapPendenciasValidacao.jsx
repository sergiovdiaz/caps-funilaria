import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import CapValidacao from "./CapValidacao";
import "./styles/CapPendenciasValidacao.css";
import clearFilterIcon from "../../assets/images/clear-filter.png";
import { formatMinutesToHHMMSS } from "./utils/capUtils";
import clipboardIcon from "../../assets/images/common/clipboard-solid.png";
import clockIcon from "../../assets/images/common/clock-solid.png";

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const STATUS_COLORS = {
  PENDENTE_VALIDACAO: "#f0ad4e",
  EM_REVISAO: "#0275d8",
  FINALIZADA: "#5cb85c",
  DEFAULT: "#6c757d",
};

const COLUMNS = {
  linha: "Linha",
  maquina: "Máquina",
  duracao_total: "Duração",
  responsavel: "Responsável",
  status: "Status",
};

// Colunas que não possuem filtro
const NON_FILTERABLE_COLUMNS = ["duracao_total"];

// ─────────────────────────────────────────────
// HOOK — lógica de filtros
// ─────────────────────────────────────────────

const useFilterableData = (data = [], columns = {}, nonFilterable = []) => {
  const [activeFilters, setActiveFilters] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState({});

  const filterableColumns = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(columns).filter(([col]) => !nonFilterable.includes(col)),
      ),
    [columns, nonFilterable],
  );

  const uniqueValues = useMemo(() => {
    const values = {};
    Object.keys(filterableColumns).forEach((col) => {
      values[col] = [...new Set(data.map((item) => item[col]).filter(Boolean))];
    });
    return values;
  }, [data, filterableColumns]);

  const filteredData = useMemo(
    () =>
      data.filter((item) =>
        Object.entries(activeFilters).every(([col, value]) => {
          if (!value) return true;
          return item[col] === value;
        }),
      ),
    [data, activeFilters],
  );

  const clearAllFilters = useCallback(() => {
    setActiveFilters(
      Object.keys(activeFilters).reduce(
        (acc, key) => ({ ...acc, [key]: null }),
        {},
      ),
    );
  }, [activeFilters]);

  return {
    activeFilters,
    setActiveFilters,
    dropdownOpen,
    setDropdownOpen,
    uniqueValues,
    filteredData,
    clearAllFilters,
  };
};

// ─────────────────────────────────────────────
// COMPONENTE ATÔMICO — célula da tabela
// ─────────────────────────────────────────────

const TableCell = React.memo(({ item, col, getStatusColor }) => {
  if (col === "status") {
    return (
      <span
        className="cappendencias__status-badge"
        style={{ backgroundColor: getStatusColor?.(item.textstatus) }}
      >
        {item.status || "-"}
      </span>
    );
  }

  if (col === "duracao_total") return formatMinutesToHHMMSS(item[col]);
  if (Array.isArray(item[col])) return item[col].length;

  return item[col] || "-";
});

TableCell.displayName = "TableCell";

// ─────────────────────────────────────────────
// COMPONENTE ATÔMICO — linha da tabela
// ─────────────────────────────────────────────

const TableRow = React.memo(
  ({ item, columns, selectedRow, onRowClick, getStatusColor }) => {
    const handleClick = useCallback(
      () => onRowClick?.(item.id_justificativa),
      [onRowClick, item.id_justificativa],
    );

    const isSelected = selectedRow === item.id_justificativa;

    return (
      <tr
        className={isSelected ? "cappendencias__row-selected" : ""}
        onClick={handleClick}
      >
        {Object.keys(columns).map((col) => (
          <td key={col}>
            <TableCell item={item} col={col} getStatusColor={getStatusColor} />
          </td>
        ))}
      </tr>
    );
  },
);

TableRow.displayName = "TableRow";

// ─────────────────────────────────────────────
// COMPONENTE ATÔMICO — cabeçalho com filtro
// ─────────────────────────────────────────────

const FilterHeader = React.memo(
  ({
    col,
    title,
    filterable,
    wrapperRefs,
    activeFilters,
    dropdownOpen,
    uniqueValues,
    onToggleDropdown,
    onFilterSelect,
  }) => {
    // Coluna sem filtro — th simples
    if (!filterable) {
      return <th>{title}</th>;
    }

    return (
      <th
        ref={(el) => (wrapperRefs.current[col] = el)}
        className="filter-header"
      >
        <span>{title}</span>
        <span
          className={`filter-arrow ${activeFilters[col] ? "filtered" : ""}`}
          onClick={() => onToggleDropdown(col)}
        >
          ▼
        </span>

        {dropdownOpen[col] && (
          <div className="filter-dropdown">
            <div
              className="filter-option"
              onClick={() => onFilterSelect(col, "")}
            >
              Todos
            </div>
            {uniqueValues[col]?.map((val) => (
              <div
                key={val}
                className="filter-option"
                onClick={() => onFilterSelect(col, val)}
              >
                {val}
              </div>
            ))}
          </div>
        )}
      </th>
    );
  },
);

FilterHeader.displayName = "FilterHeader";

// ─────────────────────────────────────────────
// COMPONENTE COMPOSTO — tabela filtrável
// ─────────────────────────────────────────────

const FilterableTable = React.memo(
  ({
    data = [],
    columns = {},
    nonFilterableColumns = [],
    onRowClick,
    selectedRow,
    getStatusColor,
    className = "",
  }) => {
    const wrapperRefs = useRef({});

    const {
      activeFilters,
      setActiveFilters,
      dropdownOpen,
      setDropdownOpen,
      uniqueValues,
      filteredData,
      clearAllFilters,
    } = useFilterableData(data, columns, nonFilterableColumns);

    // Fecha dropdown ao clicar fora
    const handleClickOutside = useCallback(
      (event) => {
        Object.keys(wrapperRefs.current).forEach((col) => {
          if (!wrapperRefs.current[col]?.contains(event.target)) {
            setDropdownOpen((prev) => ({ ...prev, [col]: false }));
          }
        });
      },
      [setDropdownOpen],
    );

    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    const handleToggleDropdown = useCallback(
      (col) => setDropdownOpen((prev) => ({ ...prev, [col]: !prev[col] })),
      [setDropdownOpen],
    );

    const handleFilterSelect = useCallback(
      (col, value) => {
        setActiveFilters((prev) => ({ ...prev, [col]: value }));
        setDropdownOpen((prev) => ({ ...prev, [col]: false }));
      },
      [setActiveFilters, setDropdownOpen],
    );

    const handleRowClick = useCallback((id) => onRowClick?.(id), [onRowClick]);

    return (
      <div className="cappendencias__table-container cappendencias__table-wrapper">
        <div className="cap-lancamentos__clear-filters-wrapper">
          <button
            className="cappendencias__clear-filters-btn"
            title="Limpar filtros"
            onClick={clearAllFilters}
          >
            <img src={clearFilterIcon} alt="Limpar filtros" />
          </button>
        </div>

        <table className={className}>
          <thead>
            <tr>
              {Object.entries(columns).map(([col, title]) => (
                <FilterHeader
                  key={col}
                  col={col}
                  title={title}
                  filterable={!nonFilterableColumns.includes(col)}
                  wrapperRefs={wrapperRefs}
                  activeFilters={activeFilters}
                  dropdownOpen={dropdownOpen}
                  uniqueValues={uniqueValues}
                  onToggleDropdown={handleToggleDropdown}
                  onFilterSelect={handleFilterSelect}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <TableRow
                key={item.id_justificativa}
                item={item}
                columns={columns}
                selectedRow={selectedRow}
                onRowClick={handleRowClick}
                getStatusColor={getStatusColor}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  },
  (prev, next) =>
    prev.data === next.data &&
    prev.selectedRow === next.selectedRow &&
    prev.className === next.className &&
    JSON.stringify(prev.columns) === JSON.stringify(next.columns),
);

FilterableTable.displayName = "FilterableTable";

// ─────────────────────────────────────────────
// COMPONENTE DE SEÇÃO — pendentes / finalizadas
// ─────────────────────────────────────────────

const CapPendenciasSection = React.memo(
  ({
    title,
    items,
    resumo,
    columns,
    selectedRow,
    onRowClick,
    getStatusColor,
  }) => {
    const handleRowClick = useCallback((id) => onRowClick?.(id), [onRowClick]);

    return (
      <>
        <div className="cappendencias__header">
          <div className="cappendencias__title">{title}</div>

          <div className="cappendencias__stats">
            <div className="cappendencias__stat-card">
              <div className="cappendencias__stat-icon">
                <img
                  src={clipboardIcon}
                  alt="icon"
                  style={{ width: 20, height: 20 }}
                />
              </div>
              <div className="cappendencias__stat-content">
                <div className="cappendencias__stat-label">Justificativas</div>
                <div className="cappendencias__stat-value">
                  {resumo.quantidade}
                </div>
              </div>
            </div>

            <div className="cappendencias__stat-card">
              <div className="cappendencias__stat-icon">
                <img
                  src={clockIcon}
                  alt="icon"
                  style={{ width: 20, height: 20 }}
                />
              </div>
              <div className="cappendencias__stat-content">
                <div className="cappendencias__stat-label">Perdas (Horas)</div>
                <div className="cappendencias__stat-value">
                  {formatMinutesToHHMMSS(resumo.perdas)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="cappendencias__tables">
          <div className="cappendencias__table-pendente">
            <FilterableTable
              data={items}
              columns={columns}
              nonFilterableColumns={NON_FILTERABLE_COLUMNS}
              selectedRow={selectedRow}
              onRowClick={handleRowClick}
              getStatusColor={getStatusColor}
              className="cap-pendencias-validacao__table"
            />
          </div>
        </div>
      </>
    );
  },
);

CapPendenciasSection.displayName = "CapPendenciasSection";

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────

const getStatusColor = (status) =>
  STATUS_COLORS[status] ?? STATUS_COLORS.DEFAULT;

// ─────────────────────────────────────────────
// COMPONENTE RAIZ
// ─────────────────────────────────────────────

const SECTIONS = [
  { key: "pendentes", title: "Pendentes", index: 0 },
  { key: "finalizadas", title: "Finalizadas", index: 1 },
];

const CapPendenciasValidacao = ({ responsavel, items, resumo }) => {
  const [selectedRow, setSelectedRow] = useState(null);

  const columns = useMemo(() => COLUMNS, []);

  const handleCloseModal = useCallback(() => setSelectedRow(null), []);

  return (
    <div className="cap-pendencias-validacao">
      <h1 className="pendjust-title">Pendências de Validação</h1>
      <h2 className="cap-pendencias-validacao__title">{responsavel}</h2>

      <div className="cap-pendencias-validacao__tables">
        {SECTIONS.map(({ key, title, index }) => (
          <div key={key} className="cap-pendencias-validacao__table-container">
            <CapPendenciasSection
              title={title}
              items={items[index]}
              resumo={resumo[index]}
              columns={columns}
              selectedRow={selectedRow}
              onRowClick={setSelectedRow}
              getStatusColor={getStatusColor}
            />
          </div>
        ))}
      </div>

      {selectedRow && (
        <div className="validation-modal-overlay" onClick={handleCloseModal}>
          <div
            className="validation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="validation-modal__close"
              onClick={handleCloseModal}
              aria-label="Fechar validação"
            >
              ×
            </button>

            <CapValidacao id={selectedRow} onUpdated={() => {}} />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CapPendenciasValidacao);

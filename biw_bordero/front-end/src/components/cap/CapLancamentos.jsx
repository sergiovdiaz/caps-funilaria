import React, { useState, useMemo, useRef, useEffect } from "react";
import "./styles/CapLancamentos.css";
import clearFilterIcon from "../../assets/images/clear-filter.png";
import { formatMinutesToMMSS } from "./utils/capUtils";
import StatusBadge from "./common/StatusBadge";

const columnTitles = {
  causaRaiz: "Causa Raiz",
  responsavel: "Responsável",
  status: "Status",
  validador: "Validador",
};

const INITIAL_FILTERS = {
  causaRaiz: "",
  responsavel: "",
  status: "",
  validador: "",
};

const INITIAL_DROPDOWNS = {
  causaRaiz: false,
  responsavel: false,
  status: false,
  validador: false,
};

const CapLancamentos = ({
  lancamentos,
  onAddJustificativa,
  selectedHour,
  onRowClick,
}) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [filtros, setFiltros] = useState(INITIAL_FILTERS);
  const [dropdownOpen, setDropdownOpen] = useState(INITIAL_DROPDOWNS);
  console.log("lancamentos ", lancamentos);

  const wrapperRefs = useRef({});

  //--------------------------------------------------
  // Fecha dropdown ao clicar fora
  //--------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInside = Object.values(wrapperRefs.current).some(
        (ref) => ref && ref.contains(event.target),
      );

      if (!clickedInside) {
        setDropdownOpen(INITIAL_DROPDOWNS);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //--------------------------------------------------
  // Valores únicos
  //--------------------------------------------------

  const uniqueValues = useMemo(() => {
    const sets = {
      causaRaiz: new Set(),
      responsavel: new Set(),
      status: new Set(),
      validador: new Set(),
    };

    for (const item of lancamentos) {
      item.causaRaiz && sets.causaRaiz.add(item.causaRaiz);
      item.responsavel && sets.responsavel.add(item.responsavel);
      item.status?.nome && sets.status.add(item.status.nome);
      item.validador && sets.validador.add(item.validador);
    }

    return Object.fromEntries(
      Object.entries(sets).map(([k, v]) => [k, [...v]]),
    );
  }, [lancamentos]);

  //--------------------------------------------------
  // Filtro
  //--------------------------------------------------

  const filteredLancamentos = useMemo(() => {
    return lancamentos.filter((item) => {
      return Object.entries(filtros).every(([key, val]) => {
        if (!val) return true;

        if (key === "status") {
          return item.status?.nome === val;
        }

        return item[key] === val;
      });
    });
  }, [lancamentos, filtros]);

  //--------------------------------------------------
  // Handlers
  //--------------------------------------------------

  const toggleDropdown = (col) => {
    setDropdownOpen((prev) => ({
      ...INITIAL_DROPDOWNS,
      [col]: !prev[col],
    }));
  };

  const handleFilterSelect = (col, value) => {
    setFiltros((prev) => ({ ...prev, [col]: value }));
    setDropdownOpen(INITIAL_DROPDOWNS);
  };

  const clearFilters = () => {
    setFiltros(INITIAL_FILTERS);
  };

  //--------------------------------------------------

  return (
    <div className="cap-lancamentos">
      {filteredLancamentos.length === 0 ? (
        <div className="cap-lancamentos__no-data">
          Nenhuma Justificativa Registrada Para o Intervalo {selectedHour}
        </div>
      ) : (
        <div className="cap-lancamentos__table-container cap-lancamentos__table-wrapper">
          <button
            className="cap-lancamentos__clear-filters-btn"
            title="Limpar filtros"
            onClick={clearFilters}
          >
            <img src={clearFilterIcon} alt="Limpar filtros" />
          </button>

          <table className="cap-lancamentos__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Modo de Falha</th>
                <th>Máquina</th>
                <th>Duração Total (min)</th>

                {Object.entries(columnTitles).map(([col, title]) => (
                  <th
                    key={col}
                    ref={(el) => (wrapperRefs.current[col] = el)}
                    className="filter-header"
                  >
                    <span>{title}</span>

                    <span
                      className={`filter-arrow ${
                        filtros[col] ? "filtered" : ""
                      }`}
                      onClick={() => toggleDropdown(col)}
                    >
                      ▼
                    </span>

                    {dropdownOpen[col] && (
                      <div className="filter-dropdown">
                        <div
                          className="filter-option"
                          onClick={() => handleFilterSelect(col, "")}
                        >
                          Todos
                        </div>

                        {uniqueValues[col].map((val) => (
                          <div
                            key={val}
                            className="filter-option"
                            onClick={() => handleFilterSelect(col, val)}
                          >
                            {val}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                ))}

                <th>Qtd. Eventos</th>
                <th>Salvo em</th>
              </tr>
            </thead>

            <tbody>
              {filteredLancamentos.map((item) => (
                <tr
                  key={item.id}
                  className={
                    selectedRow === item.id
                      ? "cap-lancamentos__row-selected"
                      : ""
                  }
                  onClick={() => {
                    setSelectedRow(item.id);
                    onRowClick(item.id);
                  }}
                >
                  <td>{item.id.slice(0, 6)}</td>

                  <td>
                    {item.data
                      ? new Date(item.data).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>

                  <td>{item.hora}</td>

                  <td className="cap-lancamentos__descricao">
                    {item.descricao}
                  </td>

                  <td>{item.maquina}</td>

                  <td>{formatMinutesToMMSS(item.duracao)}</td>

                  <td>{item.causaRaiz || "-"}</td>

                  <td>{item.responsavel}</td>

                  <td>
                    <StatusBadge
                      textstatus={item.status?.texto}
                      status={item.status?.nome || "-"}
                    />
                  </td>

                  <td>{item.validador}</td>

                  <td>{item.alarms?.length ?? 0}</td>

                  <td>
                    {item.criadoEm
                      ? new Date(item.criadoEm).toLocaleString("pt-BR")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {onAddJustificativa && (
        <button
          className="cap-lancamentos__btn-add"
          onClick={onAddJustificativa}
        >
          Adicionar Justificativa
        </button>
      )}
    </div>
  );
};

export default React.memo(CapLancamentos);

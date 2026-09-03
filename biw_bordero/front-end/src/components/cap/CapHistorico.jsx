import React, { useState, useMemo, useEffect } from "react";
import "./styles/CapHistorico.css";
import { useCapHistory } from "./hooks/useCapHistory";
import DateField from "../common/DateField";
import AggregationChart from "./AggregationChart";
import DailyTrendChart from "./DailyTrendChart";
import { DatePresets } from "./utils/DatePresets";
import Table from "./common/Table";
import { formatMinutesToHHMMSS } from "./utils/capUtils";
import "../common/styles/Dashboards.css";
import ActiveFilters from "../common/ActiveFilters"; // Importe o componente

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Função para formatar data
const formatDateTime = (isoString) => {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "-";
  }
};

const CapHistorico = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [metric, setMetric] = useState("carros"); // "dur_min" ou "carros"

  const { data, loading, error, fetchHistory } = useCapHistory();

  const [filters, setFilters] = useState({});

  const applyPreset = (preset, name) => {
    const { start, end } = preset();
    setStartDate(start);
    setEndDate(end);
    setActivePreset(name);
  };

  useEffect(() => {
    const { start, end } = DatePresets.today();

    setStartDate(start);
    setEndDate(end);
    setActivePreset("today");

    fetchHistory(formatDate(start), formatDate(end));
  }, [fetchHistory]);

  const handleBuscar = () => {
    if (!startDate || !endDate) return;
    fetchHistory(formatDate(startDate), formatDate(endDate));
  };

  const rawData = data?.data || [];

  const filteredData = useMemo(() => {
    return rawData.filter((item) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;

        // Se o valor do filtro for "NÃO IDENTIFICADO", verifica se o campo é null, undefined ou vazio
        if (value === "NÃO IDENTIFICADO") {
          return (
            item[key] === null || item[key] === undefined || item[key] === ""
          );
        }

        // TRATAMENTO ESPECIAL PARA O CAMPO TURNO
        if (key === "turno") {
          // Converte ambos para número para comparação
          const itemValue = Number(item[key]);
          const filterValue = Number(value);

          // Verifica se ambos são números válidos
          if (isNaN(itemValue) || isNaN(filterValue)) {
            return String(item[key]) === String(value);
          }

          return itemValue === filterValue;
        }

        // Caso contrário, faz a comparação normal (convertendo para string se necessário)
        return String(item[key]) === String(value);
      }),
    );
  }, [rawData, filters]);
  const setFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: prev[field] === value ? null : value,
    }));
  };

  // Função para formatar os labels dos filtros (capitalizar primeira letra)
  const getFilterLabel = (key) => {
    const labels = {
      linha: "Linha",
      responsavel: "Responsável",
      causa_raiz: "Causa Raiz",
      modo_falha: "Modo Falha",
      estacao: "Estação",
      maquina: "Máquina",
      tipo_maquina: "Tipo Máquina",
      componente: "Componente",
      turno: "Turno",
      data: "Data",
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  // Definição das colunas baseada na estrutura real dos dados
  const columns = useMemo(
    () => [
      {
        key: "id",
        label: "ID",
        filterable: true,
        sortable: true,
        width: "80px",
      },
      {
        key: "ts_inicio",
        label: "Horário de Perda",
        filterable: true,
        sortable: true,
        formatter: formatDateTime,
      },
      {
        key: "ute",
        label: "UTE",
        filterable: true,
        sortable: true,
      },
      {
        key: "linha",
        label: "Linha",
        filterable: true,
        sortable: true,
      },
      {
        key: "causa_raiz",
        label: "Causa Raiz",
        filterable: true,
        sortable: true,
      },
      {
        key: "maquina",
        label: "Máquina",
        filterable: true,
        sortable: true,
      },
      {
        key: "tipo_maquina",
        label: "Tipo Máquina",
        filterable: true,
        sortable: true,
      },
      {
        key: "componente",
        label: "Componente",
        filterable: true,
        sortable: true,
      },
      {
        key: "modo_falha",
        label: "Modo Falha",
        filterable: true,
        sortable: true,
      },
      {
        key: "estacao",
        label: "Estação",
        filterable: true,
        sortable: true,
      },
      {
        key: "turno",
        label: "Turno",
        filterable: true,
        sortable: true,
        formatter: (value) => (value ? `Turno ${value}` : "-"),
      },
      {
        key: "dur_min",
        label: "Duração",
        filterable: true,
        sortable: true,
        formatter: formatMinutesToHHMMSS,
      },
      {
        key: "carros",
        label: "Carros",
        filterable: true,
        sortable: true,
        formatter: (value) => (value ? value.toLocaleString() : "0"),
      },
      {
        key: "comentario",
        label: "Comentário",
        filterable: true,
        sortable: false,
        formatter: (value) => value || "-",
      },
    ],
    [],
  );


  return (
    <div className="cap-historico">
      {/* Filtros */}
      <div className="cap-historico__filters">
        <div className="cap-historico__date-fields">
          <DateField
            label="Data Inicial"
            value={startDate}
            onChange={setStartDate}
          />
          <DateField label="Data Final" value={endDate} onChange={setEndDate} />
        </div>

        <div className="cap-historico__presets">
          <button
            className={`cap-historico__preset-btn ${activePreset === "yesterday" ? "active" : ""}`}
            onClick={() => applyPreset(DatePresets.yesterday, "yesterday")}
          >
            Ontem
          </button>

          <button
            className={`cap-historico__preset-btn ${activePreset === "currentWeek" ? "active" : ""}`}
            onClick={() => applyPreset(DatePresets.currentWeek, "currentWeek")}
          >
            Semana Atual
          </button>

          <button
            className={`cap-historico__preset-btn ${activePreset === "lastWeek" ? "active" : ""}`}
            onClick={() => applyPreset(DatePresets.lastWeek, "lastWeek")}
          >
            Semana Passada
          </button>

          <button
            className={`cap-historico__preset-btn ${activePreset === "currentMonth" ? "active" : ""}`}
            onClick={() =>
              applyPreset(DatePresets.currentMonth, "currentMonth")
            }
          >
            Mês Atual
          </button>

          <button
            className={`cap-historico__preset-btn ${activePreset === "lastMonth" ? "active" : ""}`}
            onClick={() => applyPreset(DatePresets.lastMonth, "lastMonth")}
          >
            Mês Passado
          </button>
        </div>

        <button className="cap-historico__search-btn" onClick={handleBuscar}>
          Buscar
        </button>

        <div className="cap-historico__metric-container">
          <span className="cap-historico__metric-label">Turno</span>

          <div className="cap-historico__metric-switch">
            {[3, 1, 2].map((t) => (
              <button
                key={t}
                className={filters.turno === t ? "active" : ""}
                onClick={() => setFilter("turno", t)}
              >
                Turno {t}
              </button>
            ))}

            {/* botão pra limpar */}
            <button
              className={!filters.turno ? "active" : ""}
              onClick={() => setFilter("turno", null)}
            >
              Todos
            </button>
          </div>
        </div>

        <div className="cap-historico__metric-container">
          <span className="cap-historico__metric-label">Métrica</span>

          <div className="cap-historico__metric-switch">
            <button
              className={metric === "dur_min" ? "active" : ""}
              onClick={() => setMetric("dur_min")}
            >
              Tempo (horas)
            </button>

            <button
              className={metric === "carros" ? "active" : ""}
              onClick={() => setMetric("carros")}
            >
              Carros
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      {loading && (
        <p className="cap-historico__status cap-historico__status--loading">
          Carregando...
        </p>
      )}
      {error && (
        <p className="cap-historico__status cap-historico__status--error">
          {error}
        </p>
      )}

      {/* Gráficos */}
      {rawData.length > 0 && (
        <div className="cap-historico__charts-wrapper">
          {/* ActiveFilters antes dos gráficos */}
          <ActiveFilters
            filters={filters}
            onRemoveFilter={(key) => setFilter(key, filters[key])}
            onClearAll={() => setFilters({})}
            getFilterLabel={getFilterLabel}
            excludedKeys={[]}
            showClearAll={true}
          />

          {/* Primeira linha — Linha */}
          <div className="cap-historico__top-charts">
            <AggregationChart
              title="Linha"
              data={filteredData}
              field="linha"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.linha}
              orientation="vertical"
              labelPosition="outside"
              limit={15}
              height={130}
            />
            <DailyTrendChart
              data={filteredData}
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.data}
              height={130}
            />
          </div>

          {/* Segunda linha — demais gráficos em 3 colunas */}
          <div className="cap-historico__charts-grid">
            <AggregationChart
              title="Responsável"
              data={filteredData}
              field="responsavel"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.responsavel}
            />
            <AggregationChart
              title="Causa Raiz"
              data={filteredData}
              field="causa_raiz"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.causa_raiz}
            />
            <AggregationChart
              title="Tecnologia"
              data={filteredData}
              field="tecnologia"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.tecnologia}
              limit={8}
            />

            <AggregationChart
              title="Estação"
              data={filteredData}
              field="estacao"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.estacao}
            />
            <AggregationChart
              title="Máquina"
              data={filteredData}
              field="maquina"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.maquina}
            />
            <AggregationChart
              title="Tipo Máquina"
              data={filteredData}
              field="tipo_maquina"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.tipo_maquina}
            />

            <AggregationChart
              title="Componente"
              data={filteredData}
              field="componente"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.componente}
            />
            <AggregationChart
              title="Modo Falha"
              data={filteredData}
              field="modo_falha"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.modo_falha}
            />
            <AggregationChart
              title="Turno"
              data={filteredData}
              field="turno"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.turno}
            />

            <AggregationChart
              title="Tipo de Falha"
              data={filteredData}
              field="tipo_falha"
              metric={metric}
              onSelect={setFilter}
              activeFilter={filters.tipo_falha}
              excludeNullValues={true}
            />
          </div>
        </div>
      )}

      {/* ActiveFilters após os gráficos (opcional, pode remover se não quiser duplicar) */}
      <ActiveFilters
        filters={filters}
        onRemoveFilter={(key) => setFilter(key, filters[key])}
        onClearAll={() => setFilters({})}
        getFilterLabel={getFilterLabel}
        excludedKeys={[]}
        showClearAll={true}
      />

      {/* Tabela */}
      <div className="cap-historico__table-wrapper">
        <Table
          title={`Histórico de Eventos (${filteredData.length} registros)`}
          data={filteredData}
          columns={columns}
          isLoading={loading}
          emptyMessage="Nenhum evento encontrado no período selecionado"
          enableGlobalSearch={true}
          showPagination={true}
          itemsPerPage={10}
          initialSortColumn="carros"
          initialSortDirection="desc"
        />
      </div>
    </div>
  );
};

export default CapHistorico;

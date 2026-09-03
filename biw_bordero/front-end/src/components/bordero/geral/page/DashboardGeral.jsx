// DashboardGeral.jsx
import React from "react";
import { useDashboardGeral } from "../hooks/useDashboardGeral";
import { useDashboardGeralLogic } from "../hooks/useDashboardGeralLogic";
import { FiltersBar } from "../components/FiltersBar";
import { TopLinhasChart } from "../components/TopLinhasChart";
import { ChartsGrid } from "../components/ChartsGrid";
import ActiveFilters from "../../../common/ActiveFilters";
import Table from "../../../cap/common/Table";
import { FILTER_LABELS, TABLE_COLUMNS } from "../utils/constants.js";
import { formatDate } from "../utils/dateUtils";
import {
  prepareTipoMaquinaData,
  prepareTopMaquinasData,
} from "../utils/chartUtils";
import "./styles/DashboardGeral.css";
import "../../../../components/common/styles/Dashboards.css";
import { useMemo } from "react";

const DashboardGeral = () => {
  const {
    data,
    filters,
    setDateRange,
    loading,
    setUte,
    setLineType,
    setLinha,
    setMaquina,
    setTipoMaquina,
    drillSemana,
    voltarSemana,
    setEvento,
    resetFilters,
    removerFiltro,
  } = useDashboardGeral({
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()),
  });

  // Passa os setters para o hook de lógica
  const {
    startDate,
    endDate,
    linhaInput,
    setStartDate,
    setEndDate,
    setLinhaInput,
    handleBuscarLinha,
    handleKeyDown,
    handleChartSelect,
  } = useDashboardGeralLogic(filters, {
    setLinha,
    setMaquina,
    setTipoMaquina,
  });

  const handleBuscarData = () => {
    setDateRange(formatDate(startDate), formatDate(endDate));
  };

  // Prepara dados para os charts com useMemo para evitar recálculos
  const tipoMaquinaData = useMemo(
    () => prepareTipoMaquinaData(data),
    [data.tipoMaquina],
  );

  const topMaquinasData = useMemo(
    () => prepareTopMaquinasData(data),
    [data.topMaquinas],
  );

  return (
    <div className="dashboardgeral">
      <div className="dashboard24">
        {/* Filtros */}
        <FiltersBar
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          filters={filters}
          onUteChange={setUte}
          onLineTypeChange={setLineType}
          onBuscarData={handleBuscarData}
          linhaInput={linhaInput}
          onLinhaInputChange={(e) => setLinhaInput(e.target.value)}
          onBuscarLinha={handleBuscarLinha}
          onKeyDown={handleKeyDown}
          loading={loading}
        />

        {/* Filtros Ativos */}
        <ActiveFilters
          filters={filters}
          onRemoveFilter={removerFiltro}
          onClearAll={resetFilters}
          getFilterLabel={(key) => FILTER_LABELS[key] || key}
          excludedKeys={["startDate", "endDate"]}
          showClearAll
        />

        {/* Top Linhas */}
        <TopLinhasChart
          data={data.topLinhas}
          onSelectLinha={setLinha}
          loading={loading}
        />

        {/* Grid com Top Estações, Top Máquinas e Tendência */}
        <ChartsGrid
          tipoMaquinaData={tipoMaquinaData}
          topMaquinasData={topMaquinasData}
          tendenciaData={data.tendencia}
          filters={filters}
          loading={loading}
          onChartSelect={handleChartSelect}
          onDrillSemana={drillSemana}
          onVoltarSemana={voltarSemana}
        />

        {/* Segunda ocorrência de Filtros Ativos (opcional) */}
        <ActiveFilters
          filters={filters}
          onRemoveFilter={removerFiltro}
          onClearAll={resetFilters}
          getFilterLabel={(key) => FILTER_LABELS[key] || key}
          excludedKeys={["startDate", "endDate"]}
          showClearAll
        />

        {/* Tabela de Eventos */}
        <div className="card2">
          <Table
            title="Eventos"
            columns={TABLE_COLUMNS}
            data={data.tabela}
            isLoading={loading}
            itemsPerPage={10}
            initialSortColumn="loss_min"
            initialSortDirection="desc"
            onRowClick={(row) => setEvento(row.event_id)}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardGeral;

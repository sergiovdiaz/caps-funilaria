import React, { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";
import CapTable from "../components/cap/CapTable";
import CapDetails from "../components/cap/CapDetails";
import CapLancamentos from "../components/cap/CapLancamentos";
import CapJustificativaValidacao from "../components/cap/CapValidacao";
import { SkeletonBox, SkeletonLine } from "../components/skeleton/Skeleton";
import okIcon from "../assets/images/ok-icon.png";
import "../components/cap/styles/Cap.css";

import { CapProvider, useCap } from "../components/cap/contexts/CapContext";
import {
  LINES,
  SHIFTS,
  CATEGORY_COLORS,
} from "../components/cap/utils/capConstant";

// ======================
//  COMPONENTES AUXILIARES
// ======================
const FilterLabel = ({ label, children }) => (
  <label className="cap__filter-label">
    {label}
    {children}
  </label>
);

const ShiftSelect = ({ value, onChange, onReset, shifts }) => (
  <div className="shift-select">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="shift-select__input"
    >
      {shifts.map((shift) => (
        <option key={shift.value} value={shift.value}>
          {shift.label}
        </option>
      ))}
    </select>
    {value !== "Todos" && (
      <button
        type="button"
        onClick={onReset}
        title="Resetar turno"
        className="shift-select__reset"
      >
        ×
      </button>
    )}
  </div>
);

const Filters = () => {
  const { filters, setDate, setLine, setShift, handleReload, isReloading } =
    useCap();

  return (
    <div className="cap__filters">
      <FilterLabel label="Data">
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setDate(e.target.value)}
        />
      </FilterLabel>

      <FilterLabel label="Linha">
        <select value={filters.line} onChange={(e) => setLine(e.target.value)}>
          {LINES.map((line) => (
            <option key={line.value} value={line.value}>
              {line.label}
            </option>
          ))}
        </select>
      </FilterLabel>

      <FilterLabel label="Turno">
        <ShiftSelect
          value={filters.shift}
          onChange={setShift}
          onReset={() => setShift("Todos")}
          shifts={SHIFTS}
        />
      </FilterLabel>

      <button
        type="button"
        className="cap__reload-btn"
        onClick={handleReload}
        disabled={isReloading}
        title="Atualizar dados"
      >
        {isReloading ? "Atualizando..." : "🔄 Atualizar"}
      </button>
    </div>
  );
};

const TabNavigation = () => {
  const { uiState } = useCap();
  const { activeTab, showJustifyTab, setActiveTab, openJustifyTab } = uiState;

  return (
    <div className="cap__tabs">
      <button
        className={`cap__tab ${activeTab === "lancamentos" ? "active" : ""}`}
        onClick={() => setActiveTab("lancamentos")}
      >
        Histórico de Lançamentos
      </button>
      {showJustifyTab && (
        <button
          className={`cap__tab ${activeTab === "justificar" ? "active" : ""}`}
          onClick={openJustifyTab}
        >
          Adicionar Justificativa
        </button>
      )}
    </div>
  );
};

const JustificationPanel = () => {
  const {
    hourSelection,
    filteredTableData,
    rowSelection,
    filters,
    maquinas,
    handleSaved,
    uiState,
  } = useCap();

  return (
    <div className="cap__tab-panel" style={{ display: "flex" }}>
      <div className="cap-table-section" style={{ flex: 1 }}>
        <CapTable
          hour={hourSelection.selection.hour}
          data={filteredTableData}
          onSelectionChange={rowSelection.handleSelectionChange}
          selectedRows={rowSelection.selectedRows}
          onClearSelections={rowSelection.clearSelection}
          onPendingChange={uiState.setHasPendingChanges}
          isLoading={hourSelection.isLoadingAlarms}
        />
      </div>
      {rowSelection.selectedRows.length > 0 && (
        <div className="cap-details-section" style={{ flex: 1 }}>
          <CapDetails
            selectedRows={rowSelection.selectedRows}
            selectedHour={hourSelection.selection.hour}
            selectedDate={filters.date}
            maquinas={maquinas}
            onReset={() => {
              rowSelection.clearSelection();
              uiState.closeJustifyTab();
            }}
            onSaved={handleSaved}
          />
        </div>
      )}
    </div>
  );
};

const ChartSection = () => {
  const { filteredChartData, hourSelection, uiState, rowSelection } = useCap(); // Adicione rowSelection aqui
  const tableSectionRef = useRef(null);

  // Auto-scroll quando mudar de aba
  useEffect(() => {
    if (
      hourSelection.selection.hour &&
      uiState.activeTab === "justificar" &&
      tableSectionRef.current
    ) {
      requestAnimationFrame(() => {
        tableSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [uiState.activeTab, hourSelection.selection.hour]);

  const handleHourChange = (hourLabel, filteredIndex) => {
    if (hourLabel === hourSelection.selection.hour) {
      hourSelection.clearSelection();
      uiState.setHasPendingChanges(false);
      return;
    }

    if (rowSelection.hasSelection()) {
      // Agora rowSelection está definido
      uiState.requestHourChange(hourLabel, filteredIndex);
      return;
    }

    hourSelection.selectHour(hourLabel, filteredIndex);
  };

  const chartOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      animations: { enabled: false },
      events: {
        dataPointSelection: (_, __, config) => {
          handleHourChange(
            filteredChartData.hours[config.dataPointIndex],
            config.dataPointIndex,
          );
        },
      },
    },
    colors: filteredChartData.chartSeries.map(
      (s) => CATEGORY_COLORS[s.name] || "#999",
    ),
    xaxis: {
      categories: filteredChartData.hours,
      labels: {
        hideOverlappingLabels: true,
        trim: true,
        maxHeight: 120,
        style: { fontSize: "10px" },
      },
    },
    yaxis: {
      min: 0,
      max: Math.max(
        ...filteredChartData.hours.map((_, i) =>
          filteredChartData.chartSeries.reduce(
            (sum, s) => sum + (s.data[i] || 0),
            0,
          ),
        ),
      ),
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "40%",
      },
    },
    legend: {
      position: "bottom",
      fontSize: "10px",
      labels: {
        colors: "#333",
        useSeriesColors: false,
      },
    },
    tooltip: { shared: true, intersect: false },
    annotations: {
      points: filteredChartData.hours
        .map((hour, i) => {
          const hasNaoJustificado = filteredChartData.chartSeries.some(
            (s) => s.name === "NÃO JUSTIFICADO" && (s.data[i] || 0) > 0,
          );
          if (!hasNaoJustificado) {
            return {
              x: hour,
              y: filteredChartData.chartSeries.reduce(
                (sum, s) => sum + (s.data[i] || 0),
                0,
              ),
              marker: { size: 0 },
              image: {
                path: okIcon,
                width: 15,
                height: 15,
                offsetY: -10,
              },
            };
          }
          return null;
        })
        .filter(Boolean),
    },
  };

  return (
    <div className="cap__chart-container" ref={tableSectionRef}>
      <h2 className="cap__title">Produção por Hora</h2>
      {filteredChartData.hours.length ? (
        <Chart
          options={chartOptions}
          series={filteredChartData.chartSeries}
          type="bar"
          height={170}
          width="100%"
          style={{ marginTop: "25px" }}
        />
      ) : (
        <div className="cap__chart-empty">Nenhum dado disponível</div>
      )}
    </div>
  );
};

const ConfirmationModal = () => {
  const { uiState, hourSelection } = useCap();

  if (!uiState.showConfirmModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-alert">
          <div className="modal-alert-icon">⚠️</div>
          <div className="modal-alert-text">
            <h3>Atenção!</h3>
            <p>
              Você tem justificativas não salvas.
              <br />
              Se alterar a hora selecionada, elas serão perdidas.
            </p>
          </div>
        </div>
        <div className="modal-actions">
          <button
            onClick={() =>
              uiState.confirmHourChange(({ hour, index }) => {
                hourSelection.selectHour(hour, index);
              })
            }
          >
            OK, mudar hora
          </button>
          <button onClick={uiState.cancelHourChange}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ValidationModal = () => {
  const { uiState, refetchLancamentos } = useCap();

  if (!uiState.selectedJustificativaId) return null;

  return (
    <div
      className="validation-modal-overlay"
      onMouseDown={uiState.closeValidationModal}
    >
      <div
        className="validation-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className="validation-modal__close"
          onClick={uiState.closeValidationModal}
        >
          ×
        </button>
        <CapJustificativaValidacao
          id={uiState.selectedJustificativaId}
          onUpdated={refetchLancamentos}
        />
      </div>
    </div>
  );
};

// ======================
//  COMPONENTE PRINCIPAL (Consumer)
// ======================
const CapContent = () => {
  const { chartData, uiState, hourSelection, lancamentos } = useCap(); // Adicione lancamentos aqui

  if (chartData.isLoading && !chartData.hours.length) {
    return (
      <div className="cap__loading">
        <SkeletonBox height={200} />
        <div style={{ marginTop: "70px" }}>
          <SkeletonLine width="60%" />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine width="80%" />
          <SkeletonLine />
          <SkeletonLine width="50%" />
          <SkeletonLine width="80%" />
          <SkeletonLine />
          <SkeletonLine width="80%" />
        </div>
      </div>
    );
  }

  if (chartData.error) {
    return <div className="cap__error">Erro: {chartData.error}</div>;
  }

  return (
    <div className="cap">
      <Filters />
      <ChartSection />

      <div className="cap__content">
        <TabNavigation />

        <div className="cap__tab-content">
          {uiState.activeTab === "justificar" && <JustificationPanel />}
          {uiState.activeTab === "lancamentos" && (
            <CapLancamentos
              lancamentos={lancamentos || []}
              onAddJustificativa={uiState.openJustifyTab}
              selectedHour={hourSelection.selection.hour}
              onRowClick={uiState.openValidationModal}
            />
          )}
        </div>
      </div>

      <ConfirmationModal />
      <ValidationModal />
    </div>
  );
};

// ======================
//  WRAPPER COM PROVIDER
// ======================
const Cap = () => {
  const { line: lineParam } = useParams();
  const navigate = useNavigate();

  // Sync URL com a linha do contexto
  useEffect(() => {
    if (lineParam) {
      // O provider vai inicializar com lineParam
      // Esse useEffect é só para garantir que a URL está correta
      const currentLine = lineParam.toUpperCase();
      if (currentLine !== lineParam) {
        navigate(`/cap/justificar/${currentLine}`, { replace: true });
      }
    }
  }, [lineParam, navigate]);

  return (
    <CapProvider lineParam={lineParam}>
      <CapContent />
    </CapProvider>
  );
};

export default Cap;

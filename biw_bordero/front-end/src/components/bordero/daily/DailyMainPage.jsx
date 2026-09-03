import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import SummaryCard from "./SummaryCard";
import StatusChart from "./StatusChart";
import ClusterChart from "./ClusterChart";
import LossTimeChart from "./LossTimeChart";

import LossesTable from "../actualshift/LossesTable";
import { getTopLossData } from "./utils/utils";
import { useFilteredEvents } from "./hooks/useFilteredEvents";
import { SkeletonBox, SkeletonLine } from "../../skeleton/Skeleton";
import "./styles/DailyMainPage.css";
import { FILTER_LABELS } from "./utils/utils";
import "../../common/styles/Dashboards.css";

const DailyMainPage = ({ data }) => {
  // ==================== FILTROS GLOBAIS ====================
  const isLoading = !data;
  const {
    filters,
    setFilters,
    clearFilters,
    filteredEvents,
    filteredHourlyData,
  } = useFilteredEvents(data?.events, data?.hourly_production);

  const [lossTimeView, setLossTimeView] = useState("machine");

  // ==================== SUMÁRIO DIÁRIO ====================
  const dailySummary = useMemo(() => {
    const emptySummary = {
      previsto: null,
      realizado: null,
      delta: null,
      ope: null,
      jph: null,
    };

    const cards = data?.summary?.cards;

    return {
      total: cards?.total ?? emptySummary,
      1: cards?.["1"] ?? emptySummary,
      2: cards?.["2"] ?? emptySummary,
      3: cards?.["3"] ?? emptySummary,
    };
  }, [data]);
  // ==================== PRODUÇÃO HORA A HORA ====================

  const hourlyBarColors = useMemo(() => {
    return filteredHourlyData.map((d) => {
      // Se houver uma hora selecionada no filtro
      if (filters.hour !== null && filters.hour !== undefined) {
        // Comparamos a hora do dado atual com a hora do filtro
        return parseInt(d.hour) === filters.hour ? "#1e2d64" : "#cbd5e1";
      }
      return "#243782"; // Cor azul padrão quando nada está selecionado
    });
  }, [filteredHourlyData, filters.hour]);

  const hourlyChart = useMemo(() => {
    return {
      series: [
        { name: "Produção", data: filteredHourlyData.map((d) => d.value) },
      ],
      options: {
        chart: {
          type: "bar",
          fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif",
          events: {
            dataPointSelection: (_, __, config) => {
              const hour = parseInt(
                filteredHourlyData[config.dataPointIndex].hour,
              );
              setFilters((prev) => ({
                ...prev,
                hour: prev.hour === hour ? null : hour,
              }));
            },
          },
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: "60%",
            distributed: true, // Importante: permite que cada barra tenha sua própria cor do array
          },
        },
        xaxis: {
          categories: filteredHourlyData.map((d) => d.hourLabel),
          labels: { style: { colors: "#64748b" } },
        },
        // Aplicando as cores dinâmicas aqui
        colors: hourlyBarColors,
        legend: {
          show: false, // Esconde a legenda pois as cores variam por barra
        },
        tooltip: {
          y: {
            formatter: (val) => `${val} unidades`, // Ajuste conforme sua unidade de produção
          },
        },
      },
    };
  }, [filteredHourlyData, hourlyBarColors, setFilters]);

  return (
    <div className="dailymainpage-dashboard">
      {/* ==================== BARRA DE FILTROS ==================== */}
      <div className="active-filters">
        {Object.entries(filters)
          .filter(([key, value]) => value !== null && value !== undefined)
          .map(([key, value]) => (
            <div key={key} className="filter-chip">
              <span>
                {FILTER_LABELS[key] || key}: {value}
              </span>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, [key]: null }))}
              >
                ×
              </button>
            </div>
          ))}

        {Object.values(filters).some((f) => f !== null && f !== undefined) && (
          <button className="clear-all" onClick={() => clearFilters()}>
            Limpar todos
          </button>
        )}
      </div>

      {/* ==================== CARDS RESUMO ==================== */}
      <div className="daily-summary">
        {isLoading ? (
          <>
            <SkeletonBox height={90} />
            <SkeletonBox height={90} />
            <SkeletonBox height={90} />
            <SkeletonBox height={90} />
          </>
        ) : (
          <>
            <SummaryCard
              title="Dia"
              data={dailySummary?.total ?? {}}
              onClick={() =>
                setFilters((prev) => ({ ...prev, shift_number: null }))
              }
              active={filters.shift_number === null} // dia selecionado quando nenhum turno
            />
            <SummaryCard
              title="Turno 3"
              data={dailySummary["3"]}
              onClick={() =>
                setFilters((prev) => ({ ...prev, shift_number: 3 }))
              }
              active={filters.shift_number === 3}
            />
            <SummaryCard
              title="Turno 1"
              data={dailySummary["1"]}
              onClick={() =>
                setFilters((prev) => ({ ...prev, shift_number: 1 }))
              }
              active={filters.shift_number === 1}
            />
            <SummaryCard
              title="Turno 2"
              data={dailySummary["2"]}
              onClick={() =>
                setFilters((prev) => ({ ...prev, shift_number: 2 }))
              }
              active={filters.shift_number === 2}
            />
          </>
        )}
      </div>

      {/* ==================== PRODUÇÃO HORA A HORA ==================== */}
      {isLoading ? (
        <div className="card">
          <SkeletonBox height={180} /> {/* gráfico */}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: "var(--spacing-lg)" }}>
          <h2>Produção Hora a Hora</h2>
          <Chart {...hourlyChart} type="bar" height={180} />
        </div>
      )}
      {/* ==================== GRID DE CHARTS ==================== */}
      <div className="grid-4">
        {/* Perdas por voz */}
        <div className="card">
          <h2>Perdas por Voz</h2>
          {isLoading ? (
            <SkeletonBox height={180} />
          ) : (
            <StatusChart
              events={filteredEvents}
              filters={filters}
              setFilters={setFilters}
            />
          )}
        </div>

        {/* Perda por tipo de máquina */}
        <div className="card">
          <h2>Perda por Tipo de Máquina</h2>
          {isLoading ? (
            <SkeletonBox height={180} />
          ) : (
            <ClusterChart
              events={filteredEvents}
              filters={filters}
              setFilters={setFilters}
            />
          )}
        </div>

        {/* Perdas por estação */}
        <div className="card">
          <h2>Perdas por Estação</h2>
          {isLoading ? (
            <SkeletonBox height={180} />
          ) : (
            <LossTimeChart
              events={filteredEvents}
              view="station"
              filters={filters}
              setFilters={setFilters}
            />
          )}
        </div>

        {/* 5º gráfico dinâmico Máquina / Componente */}
        <div className="card">
          <h2>
            Perdas por {lossTimeView === "machine" ? "Máquina" : "Componente"}
          </h2>
          {isLoading ? (
            <SkeletonBox height={30} width={150} /> // altura e largura aproximadas do toggle
          ) : (
            <div className="toggle">
              <button
                onClick={() => setLossTimeView("machine")}
                className={lossTimeView === "machine" ? "active" : ""}
              >
                Máquina
              </button>
              <button
                onClick={() => setLossTimeView("component")}
                className={lossTimeView === "component" ? "active" : ""}
              >
                Componente
              </button>
            </div>
          )}

          {isLoading ? (
            <SkeletonBox height={180} />
          ) : (
            <LossTimeChart
              events={filteredEvents}
              view={lossTimeView} // "machine" ou "component"
              filters={filters}
              setFilters={setFilters}
            />
          )}
        </div>
      </div>

      <div className="active-filters">
        {Object.entries(filters)
          .filter(([key, value]) => value !== null && value !== undefined)
          .map(([key, value]) => (
            <div key={key} className="filter-chip">
              <span>
                {FILTER_LABELS[key] || key}: {value}
              </span>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, [key]: null }))}
              >
                ×
              </button>
            </div>
          ))}

        {Object.values(filters).some((f) => f !== null && f !== undefined) && (
          <button className="clear-all" onClick={() => clearFilters()}>
            Limpar todos
          </button>
        )}
      </div>

      {/* ==================== TABELA FILTRADA ==================== */}
      {isLoading ? (
        <div className="card">
          <SkeletonLine width="30%" />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
        </div>
      ) : (
        <LossesTable data={filteredEvents} />
      )}
    </div>
  );
};

export default DailyMainPage;

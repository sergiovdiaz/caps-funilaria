import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import { getTopLossData, secondsToHHMMSS } from "./utils/utils";

const LossTimeChart = ({ events, view, setFilters, filters }) => {
  const lossData = useMemo(() => {
    if (!events || events.length === 0) return [];

    if (view === "station") {
      return getTopLossData(events, "station");
    } else if (view === "machine") {
      return getTopLossData(
        events.map((e) => ({
          ...e,
          machine: e.element || "-", // para máquina
          losstime: e.losstime,
        })),
        "machine",
      );
    } else if (view === "component") {
      return getTopLossData(
        events.map((e) => ({
          ...e,
          componentKey: e.component || "-", // nome temporário para agrupar
          losstime: e.losstime,
        })),
        "component", // agrupa pelo componente
      );
    }
  }, [events, view]);

  // Define cores dinamicamente baseado no filtro ativo
  const barColors = useMemo(() => {
    return lossData.map((d) => {
      const activeFilter =
        (view === "component" && filters.component) ||
        (view === "machine" && filters.machine);

      if (activeFilter) {
        const selectedValue =
          view === "component" ? filters.component : filters.machine;

        return d.label === selectedValue ? "#1e2d64" : "#cbd5e1"; // azul escuro + cinza
      }

      return "#243782"; // azul padrão (igual ao outro gráfico)
    });
  }, [lossData, filters.component, filters.machine, view]);

  const options = useMemo(() => {
    return {
      chart: {
        type: "bar",
        fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif",
        events: {
          dataPointSelection: (_, __, config) => {
            const idx = config.dataPointIndex;
            if (!lossData[idx]) return;
            const value = lossData[idx].label;

            if (view === "component") {
              setFilters((prev) => ({
                ...prev,
                component: prev.component === value ? null : value,
              }));
            } else if (view === "station") {
              setFilters((prev) => ({
                ...prev,
                station: prev.station === value ? null : value,
              }));
            } else {
              setFilters((prev) => ({
                ...prev,
                machine: prev.machine === value ? null : value,
              }));
            }
          },
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "55%",
          dataLabels: {
            position: "top", // label em cima da barra
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => secondsToHHMMSS(val), // HH:MM:SS
        offsetY: -20, // desloca acima da barra
        style: {
          fontSize: "12px",
          fontWeight: 600,
          colors: ["#334155"], // cor do label
        },
      },
      yaxis: {
        show: false,
      },
      xaxis: {
        categories: lossData.map((d) => d.label),
        labels: {
          style: {
            fontSize: "12px",
            colors: "#64748b",
          },
        },
      },
      // yaxis: { show: false }, // remove eixo Y
      grid: {
        borderColor: "var(--border-light)",
        strokeDashArray: 4,
        padding: { top: 0, right: 8, bottom: 0, left: 8 },
      },
      colors: barColors,
      tooltip: {
        shared: false,
        y: {
          formatter: (val) => secondsToHHMMSS(val), // tooltip em HH:MM:SS
        },
        x: {
          formatter: (_, { dataPointIndex }) => lossData[dataPointIndex]?.label,
        },
      },
    };
  }, [lossData, barColors, view, setFilters]);

  return (
    <Chart
      key={JSON.stringify(filters)} // força recriar o gráfico sempre que filtros mudarem
      options={options}
      series={[{ name: "Loss Time", data: lossData.map((d) => d.value) }]}
      type="bar"
      height={200}
    />
  );
};

export default LossTimeChart;

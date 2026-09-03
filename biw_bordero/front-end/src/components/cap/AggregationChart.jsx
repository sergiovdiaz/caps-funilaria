import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import { useAggregation } from "./hooks/useAggregation";
import { buildAggregatedSeries } from "./utils/buildAggregatedSeries";
import { formatMinutesToHHMMSS } from "./utils/capUtils";

const AggregationChart = ({
  data,
  field,
  title,
  metric = "dur_min",
  onSelect,
  activeFilter,
  orientation = "horizontal",
  limit = 5,
  groupOthers = false,
  height = 125,
  labelPosition = "inside", // "inside" ou "outside"
}) => {
  const aggregated = useAggregation(data, field, metric);

  const { categories, seriesData } = useMemo(() => {
    const result = buildAggregatedSeries({ aggregated, limit, groupOthers });

    // Filtrar índices onde o nome da categoria NÃO é "NÃO SE APLICA"
    const filteredIndices = result.categories.reduce((acc, category, index) => {
      if (category !== "NÃO SE APLICA") {
        acc.push(index);
      }
      return acc;
    }, []);

    // Aplicar o filtro nas categorias e nos dados
    const filteredCategories = filteredIndices.map((i) => result.categories[i]);
    const filteredSeriesData = filteredIndices.map((i) => result.seriesData[i]);

    return {
      categories: filteredCategories,
      seriesData: filteredSeriesData,
    };
  }, [aggregated, limit, groupOthers]);

  const isHorizontal = orientation === "horizontal";

  // Função para truncar texto com no máximo 7 caracteres
  const truncateLabel = (text, maxLength = 9) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Labels truncadas para exibição (mantém o valor original para o tooltip e seleção)
  const truncatedCategories = useMemo(() => {
    return categories.map((cat) => truncateLabel(cat, 9));
  }, [categories]);

  const labelStyle = {
    fontSize: "var(--font-xxs)",
    colors: "var(--text-secondary)",
    fontFamily: "var(--font-family)",
  };

  const series = [
    {
      name:
        metric === "dur_min" || metric === "loss_min" ? "Duração" : "Carros",
      data: seriesData,
    },
  ];
  const maxValue = seriesData.length > 0 ? Math.max(...seriesData) : 0;

  // Configurações de dataLabels baseado na posição
  const getDataLabelsConfig = () => {
    const baseConfig = {
      enabled: true,
      formatter: (value) => formatValue(value),
      style: {
        fontSize: "var(--font-xs)",
        fontFamily: "var(--font-family)",
        fontWeight: 500,
      },
      dropShadow: { enabled: false },
    };

    if (labelPosition === "outside") {
      if (isHorizontal) {
        // Barras horizontais: label fora à direita
        return {
          ...baseConfig,
          style: {
            ...baseConfig.style,
            colors: ["#000000"], // PRETO
          },
          offsetX: 8, // Positivo puxa pra DIREITA (fora da barra)
        };
      } else {
        // Barras verticais: label fora no topo
        return {
          ...baseConfig,
          style: {
            ...baseConfig.style,
            colors: ["#383737"], // PRETO
          },
          offsetY: -18, // Negativo puxa pra CIMA (fora da barra)
        };
      }
    } else {
      // labelPosition === "inside" (padrão)
      return {
        ...baseConfig,
        style: {
          ...baseConfig.style,
          colors: ["#ffffff"], // BRANCO dentro da barra
        },
      };
    }
  };

  const options = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        background: "transparent",
        fontFamily: "var(--font-family)",
        events: {
          dataPointSelection: (_event, _ctx, config) => {
            // Usa a categoria ORIGINAL (não truncada) para seleção
            const selectedValue = categories[config.dataPointIndex];
            if (selectedValue !== "Outros") {
              onSelect(field, selectedValue);
            }
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: isHorizontal,
          borderRadius: 4,
          borderRadiusApplication: "end",
          dataLabels: {
            position:
              labelPosition === "outside"
                ? isHorizontal
                  ? "right"
                  : "top"
                : "center",
          },
        },
      },
      xaxis: {
        categories: isHorizontal ? categories : truncatedCategories,
        min: isHorizontal ? 0 : undefined,
        max: isHorizontal ? maxValue * 1.1 : undefined,
        labels: {
          show: !isHorizontal,
          style: labelStyle,
          formatter: !isHorizontal ? undefined : (val) => formatValue(val),
          // Para gráficos verticais: adiciona tooltip com label completa
          ...(!isHorizontal && {
            tooltip: {
              enabled: true,
              formatter: (val) => {
                const originalIndex = truncatedCategories.findIndex(
                  (t) => t === val,
                );
                return originalIndex !== -1 ? categories[originalIndex] : val;
              },
            },
          }),
        },
        axisBorder: { color: "var(--border-light)" },
        axisTicks: { color: "var(--border-light)" },
      },
      yaxis: {
        min: !isHorizontal ? 0 : undefined,
        max: !isHorizontal ? maxValue * 1.1 : undefined,
        categories: isHorizontal ? truncatedCategories : undefined,
        labels: {
          show: isHorizontal,
          style: labelStyle,
          formatter: isHorizontal ? undefined : (val) => formatValue(val),
          // Para gráficos horizontais: adiciona tooltip com label completa
          ...(isHorizontal && {
            tooltip: {
              enabled: true,
              formatter: (val) => {
                const originalIndex = truncatedCategories.findIndex(
                  (t) => t === val,
                );
                return originalIndex !== -1 ? categories[originalIndex] : val;
              },
            },
          }),
        },
      },
      dataLabels: getDataLabelsConfig(),

      colors: categories.map((cat) =>
        cat === activeFilter ? "#1a2966" : "#243782",
      ),
      states: {
        hover: { filter: { type: "lighten", value: 0.1 } },
        active: { filter: { type: "darken", value: 0.15 } },
      },
      grid: {
        borderColor: "var(--border-light)",
        strokeDashArray: 4,
        padding: {
          top: isHorizontal ? -30 : -25, // reduzido para -15 (era -25)
          right: 8,
          bottom: 0,
          left: 8,
        },
      },
      tooltip: {
        theme: "light",
        style: {
          fontSize: "var(--font-xs)",
          fontFamily: "var(--font-family)",
        },
        y: { formatter: (value) => formatValue(value) },
        // Tooltip mostra o valor completo da categoria
        x: {
          formatter: (val) => {
            // Tenta encontrar o valor original
            const originalIndex = truncatedCategories.findIndex(
              (t) => t === val,
            );
            return originalIndex !== -1 ? categories[originalIndex] : val;
          },
        },
      },
      legend: { show: false },
    }),
    [
      categories,
      truncatedCategories,
      activeFilter,
      isHorizontal,
      field,
      onSelect,
      labelPosition,
      maxValue,
    ],
  );

  const formatValue = (value) => {
    if (metric === "dur_min" || metric == "loss_min") {
      return formatMinutesToHHMMSS(value);
    }
    return Math.floor(value);
  };

  // Se depois do filtro não tiver dados, não renderiza
  if (categories.length === 0 || seriesData.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h2>{title}</h2>

      <div
        className="active-filters"
        style={{
          marginBottom: 0,
          marginTop: 0,
          visibility: activeFilter ? "visible" : "hidden",
        }}
      >
        <div className="filter-chip" style={{ padding: "6px", gap: "4px" }}>
          <span
            className="chip-val"
            style={{
              fontSize: "var(--font-xxs)",
            }}
          >
            {activeFilter || " "} {/* &nbsp; para manter altura quando vazio */}
          </span>
          {activeFilter && (
            <button onClick={() => onSelect(field, activeFilter)}>×</button>
          )}
        </div>
      </div>

      <Chart options={options} series={series} type="bar" height={height} />
    </div>
  );
};

export default AggregationChart;

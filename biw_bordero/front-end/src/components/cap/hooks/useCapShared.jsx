// hooks/useCapShared.jsx
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  useChartData,
  useHourSelection,
  useUIState,
  useRowSelection,
  useMachines,
  useValidacoes,
} from "./CapPage/hooks";

export function useCapShared(lineParam) {
  // ── Filtros globais ──
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() - 1);
    return {
      date: now.toISOString().split("T")[0],
      line: (lineParam || "SCC").toUpperCase(),
      shift: "Todos",
    };
  });

  const setDate = useCallback((value) => {
    if (!value) return;
    let date = new Date(value + "T00:00:00");
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    setFilters((prev) => ({ ...prev, date: date.toISOString().split("T")[0] }));
  }, []);

  const setLine = useCallback((line) => {
    setFilters((prev) => ({ ...prev, line: line.toUpperCase() }));
  }, []);

  const setShift = useCallback((shift) => {
    setFilters((prev) => ({ ...prev, shift }));
  }, []);

  // ── Hooks de dados ──
  const chartData = useChartData(filters.line, filters.date);
  const rowSelection = useRowSelection();
  const uiState = useUIState();
  const hourSelection = useHourSelection(
    chartData,
    filters.line,
    filters.shift,
  );
  const maquinas = useMachines(filters.line);

  const { lancamentos, refetch: refetchLancamentos } = useValidacoes(
    filters.date,
    filters.line,
    hourSelection.selection.hour,
  );

  // ── Reset quando contexto muda ──
  useEffect(() => {
    hourSelection.clearSelection();
    rowSelection.clearSelection();
    uiState.closeJustifyTab();
  }, [filters.date, filters.line]);

  // ── Reload ──
  const [isReloading, setIsReloading] = useState(false);
  const handleReload = useCallback(async () => {
    setIsReloading(true);
    try {
      await Promise.all([chartData.refetch(), refetchLancamentos()]);
    } finally {
      setIsReloading(false);
    }
  }, [chartData, refetchLancamentos]);

  // ── Após salvar ──
  const handleSaved = useCallback(async () => {
    await refetchLancamentos();
    await chartData.refetch();
    rowSelection.clearSelection();
  }, [refetchLancamentos, chartData, rowSelection]);

  // ── Dados filtrados (chart + table) ──
  const filteredChartData = useMemo(() => {
    const { hours, indices } = hourSelection.filteredData;
    if (!hours.length) return { hours: [], chartSeries: [] };
    return {
      hours,
      chartSeries: chartData.chartSeries.map((serie) => ({
        name: serie.name,
        data: indices.map((idx) => serie.data[idx] ?? 0),
      })),
    };
  }, [hourSelection.filteredData, chartData.chartSeries]);

  const filteredTableData = useMemo(() => {
    if (!hourSelection.selection.hour || !hourSelection.alarmData.length)
      return [];
    return hourSelection.alarmData.filter((item) => item.line === filters.line);
  }, [hourSelection.alarmData, hourSelection.selection.hour, filters.line]);

  return {
    // filtros
    filters,
    setDate,
    setLine,
    setShift,

    // dados
    chartData,
    filteredChartData,
    filteredTableData,
    lancamentos,
    maquinas,

    // seleções
    hourSelection,
    rowSelection,
    uiState,

    // ações
    handleReload,
    handleSaved,
    refetchLancamentos,
    isReloading,
  };
}

// useLossDashboard.js
import { useEffect, useState, useCallback } from "react";
import { fetchDashboardGeral } from "../../../../../api/bordero.http";

export function useDashboardGeral(initialFilters) {
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    ute: null,
    line_type: null,
    line: null,
    maquina: null,
    linestation: null,
    semana: null,
    nivel: "semana",
    event_id: null,
    ...initialFilters,
  });

  const [data, setData] = useState({
    topLinhas: [],
    topMaquinas: [],
    tipoMaquina: [],
    tendencia: [],
    tabela: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // =============================
  // LOAD DATA
  // =============================
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchDashboardGeral(filters);

      setData(res.data);
    } catch (err) {
      console.error("Erro dashboard:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // =============================
  // AUTO LOAD
  // =============================
  useEffect(() => {
    loadData();
  }, [loadData]);

  // =============================
  // ACTIONS (interações)
  // =============================

  const setLinha = (line) => {
    setFilters((f) => ({
      ...f,
      line,
      maquina: null,
      linestation: null,
      event_id: null,
    }));
  };

  const setMaquina = (maquina) => {
    setFilters((f) => ({
      ...f,
      maquina,
      event_id: null,
    }));
  };

  const setTipoMaquina = (tipo) => {
    setFilters((f) => ({
      ...f,
      linestation: tipo,
      event_id: null,
    }));
  };

  const drillSemana = (semana) => {
    setFilters((f) => ({
      ...f,
      nivel: "dia",
      semana,
    }));
  };

  const voltarSemana = () => {
    setFilters((f) => ({
      ...f,
      nivel: "semana",
      semana: null,
    }));
  };

  const setEvento = (event_id) => {
    setFilters((f) => ({
      ...f,
      event_id,
    }));
  };

  const setUte = (utes) => {
    setFilters((f) => ({
      ...f,
      ute: utes,
    }));
  };

  const setLineType = (type) => {
    setFilters((f) => ({
      ...f,
      line_type: type,
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: initialFilters?.startDate || null,
      endDate: initialFilters?.endDate || null,
      line: null,
      maquina: null,
      linestation: null,
      semana: null,
      nivel: "semana",
      event_id: null,

      // novos
      ute: [],
      line_type: null,
    });
  };

  const setDateRange = (startDate, endDate) => {
    setFilters((f) => ({
      ...f,
      startDate,
      endDate,
      semana: null, // limpa drill
      nivel: "semana",
    }));
  };

  const removerFiltro = (key) => {
    setFilters((f) => ({
      ...f,
      [key]: null,
    }));
  };

  // =============================
  // RETURN
  // =============================
  return {
    data,
    filters,
    loading,
    error,

    // ações
    setUte,
    setLineType,
    setLinha,
    setMaquina,
    setTipoMaquina,
    drillSemana,
    voltarSemana,
    setEvento,
    resetFilters,
    setDateRange,
    removerFiltro,

    // util
    reload: loadData,
  };
}

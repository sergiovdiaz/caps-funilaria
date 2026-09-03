import { useState, useMemo } from "react";

export const useFilteredEvents = (events = [], hourlyData = []) => {
  const [filters, setFilters] = useState({
    hour: null,
    status: null,
    cluster: null,
    station: null,
    machine: null,
    shift_number: null, // renomeado para ficar consistente
  });

  const clearFilters = () =>
    setFilters({
      hour: null,
      status: null,
      cluster: null,
      station: null,
      machine: null,
      shift_number: null,
    });

  // ================= FILTRO DE EVENTOS =================
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    return events.filter((e) => {
      const startTime = new Date(e.start_time).getTime();

      // Filtro por hora
      if (filters.hour !== null) {
        const hourly = hourlyData?.find(
          (h) =>
            h.hour === filters.hour &&
            startTime >= new Date(h.ts_inicio).getTime() &&
            startTime <= new Date(h.ts_fim).getTime()
        );
        if (!hourly) return false;
      }

      // Filtros existentes
      if (filters.status && e.status !== filters.status) return false;
      if (filters.cluster && e.tipo_maquina !== filters.cluster) return false;
      if (filters.station && (e.station || "-") !== filters.station)
        return false;
      if (filters.machine && (e.element || "-") !== filters.machine)
        return false;
      if (filters.component && (e.component || "-") !== filters.component)
        return false;

      // Filtro por turno
      if (
        filters.shift_number !== null &&
        e.shift_number !== filters.shift_number
      )
        return false;

      return true;
    });
  }, [events, hourlyData, filters]);

  // ================= FILTRO DE PRODUÇÃO HORÁRIA =================
  // ================= FILTRO DE PRODUÇÃO HORÁRIA =================
  const filteredHourlyData = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) return [];

    return hourlyData
      .filter((h) => {
        // Filtra por turno
        if (
          filters.shift_number !== null &&
          h.shift_number !== filters.shift_number
        )
          return false;

        // // Filtra por hora, se houver
        // if (filters.hour !== null && h.hour !== filters.hour) return false;

        return true;
      })
      .map((h) => ({
        ...h,
        hourLabel: `${String(h.hour).padStart(2, "0")}:00`, // <- adiciona aqui
      }));
  }, [hourlyData, filters]);

  return {
    filters,
    setFilters,
    clearFilters,
    filteredEvents,
    filteredHourlyData,
  };
};

// hooks/useDashboardGeralLogic.js
import { useState, useEffect, useCallback, useRef } from "react";
import { getToday, parseDateFromFilter } from "../utils/dateUtils";

export const useDashboardGeralLogic = (filters, setters = {}) => {
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [linhaInput, setLinhaInput] = useState("");

  const filtersRef = useRef(filters);
  const settersRef = useRef(setters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    settersRef.current = setters;
  }, [setters]);

  useEffect(() => {
    if (filters?.startDate) {
      setStartDate(parseDateFromFilter(filters.startDate));
    } else {
      setStartDate(getToday());
    }
  }, [filters?.startDate]);

  useEffect(() => {
    if (filters?.endDate) {
      setEndDate(parseDateFromFilter(filters.endDate));
    } else {
      setEndDate(getToday());
    }
  }, [filters?.endDate]);

  useEffect(() => {
    if (!filters?.line) {
      setLinhaInput("");
    }
  }, [filters?.line]);

  const handleBuscarLinha = useCallback(() => {
    if (!linhaInput) return;
    if (settersRef.current?.setLinha) {
      settersRef.current.setLinha(linhaInput);
    }
  }, [linhaInput]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleBuscarLinha();
      }
    },
    [handleBuscarLinha],
  );

  // Handler que recebe os dois parâmetros do AggregationChart
  const handleChartSelect = useCallback((field, value) => {
    console.log("=== handleChartSelect (2 params) ===");
    console.log("field recebido:", field);
    console.log("value recebido:", value);
    console.log("filters atual:", filtersRef.current);

    // Se não veio value, tenta usar o field como value (caso de 1 param)
    const actualValue = value !== undefined ? value : field;
    const actualField = value !== undefined ? field : "unknown";

    console.log("actualField:", actualField);
    console.log("actualValue:", actualValue);

    // Validação: se o valor for igual a "linestation" ou "maquina", é erro
    if (actualValue === "linestation" || actualValue === "maquina") {
      console.error("❌ ERRO: value é o nome do campo, não o valor real!");
      return;
    }

    if (actualField === "linestation") {
      const isSelected = filtersRef.current?.linestation === actualValue;
      const newValue = isSelected ? null : actualValue;

      console.log(
        `📊 Estação: ${isSelected ? "Removendo" : "Adicionando"}`,
        newValue,
      );

      if (settersRef.current?.setTipoMaquina) {
        settersRef.current.setTipoMaquina(newValue);
      }
    } else if (actualField === "maquina") {
      const isSelected = filtersRef.current?.maquina === actualValue;
      const newValue = isSelected ? null : actualValue;

      console.log(
        `🔧 Máquina: ${isSelected ? "Removendo" : "Adicionando"}`,
        newValue,
      );

      if (settersRef.current?.setMaquina) {
        settersRef.current.setMaquina(newValue);
      }
    } else {
      console.warn("Campo não reconhecido:", actualField);
    }
  }, []);

  return {
    startDate,
    endDate,
    linhaInput,
    setStartDate,
    setEndDate,
    setLinhaInput,
    handleBuscarLinha,
    handleKeyDown,
    handleChartSelect,
  };
};

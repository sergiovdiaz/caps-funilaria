import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  getCapProd,
  getCapListarJustificativas,
  getCapAlarms,
} from "../../../../../api/api";

import {
  getCapListarMaquinas,
  getCapListarMantenedores,
} from "../../../../../api/cap.http";

export const useChartData = (selectedLine, selectedDate) => {
  const [chartData, setChartData] = useState({
    hours: [],
    ts: [],
    chartSeries: [],
    turnos: [],
    isLoading: false,
    error: null,
  });

  const fetchChartData = useCallback(async () => {
    if (!selectedLine || !selectedDate) return;

    setChartData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await getCapProd(selectedLine, selectedDate);
      console.log("Dados recebidos para o gráfico:", data);

      setChartData({
        hours: data.hours,
        ts: data.ts,
        chartSeries: data.chartSeries,
        turnos: data.turnos,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do gráfico:", error);
      setChartData((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  }, [selectedLine, selectedDate]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  return { ...chartData, refetch: fetchChartData };
};

/**
 * Hook para gerenciar a seleção de hora e dados de alarmes
 */
// export const useHourSelection = (chartData, selectedLine, selectedShift) => {
//   const [selection, setSelection] = useState({
//     hour: null,
//     filteredIndex: null,
//     originalIndex: null,
//   });
//   console.log("selection.hour: ", selection.hour);
//   const [alarmData, setAlarmData] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const { hours, ts, turnos } = chartData;

//   // Filtra dados baseado no turno selecionado - CORRIGIDO
//   const filteredData = useMemo(() => {
//     if (!hours.length) {
//       return { hours: [], ts: [], turnos: [], indices: [] };
//     }

//     if (selectedShift === "Todos") {
//       // CORREÇÃO: Criar array de índices sequenciais
//       const indices = Array.from({ length: hours.length }, (_, i) => i);
//       return {
//         hours: [...hours],
//         ts: [...ts],
//         turnos: [...turnos],
//         indices, // [0, 1, 2, 3, ...]
//       };
//     }

//     // Filtra por turno específico
//     const indices = turnos
//       .map((turno, idx) => (turno === selectedShift ? idx : -1))
//       .filter((idx) => idx !== -1);

//     return {
//       hours: indices.map((idx) => hours[idx]),
//       ts: indices.map((idx) => ts[idx]),
//       turnos: indices.map((idx) => turnos[idx]),
//       indices,
//     };
//   }, [selectedShift, hours, ts, turnos]);

//   // Converte índice filtrado para índice original - CORRIGIDO
//   const getOriginalIndex = useCallback(
//     (filteredIndex) => {
//       if (filteredIndex === null || filteredIndex === undefined) return null;
//       if (selectedShift === "Todos") return filteredIndex;

//       // Verifica se filteredIndex existe no array de índices
//       if (filteredIndex >= 0 && filteredIndex < filteredData.indices.length) {
//         return filteredData.indices[filteredIndex];
//       }
//       return null;
//     },
//     [selectedShift, filteredData.indices],
//   );

//   // Busca dados de alarmes para a hora selecionada
//   const fetchAlarmsForHour = useCallback(
//     async (originalIndex) => {
//       if (!selectedLine || originalIndex === null || !ts[originalIndex]) return;

//       const [startHour, endHour] = ts[originalIndex];
//       const THREE_HOURS = 3 * 60 * 60 * 1000;

//       const startAdjusted = new Date(
//         new Date(startHour).getTime() - THREE_HOURS,
//       );
//       const endAdjusted = new Date(new Date(endHour).getTime() - THREE_HOURS);

//       setIsLoading(true);
//       try {
//         const alarms = await getCapAlarms(selectedLine, [
//           startAdjusted.toISOString(),
//           endAdjusted.toISOString(),
//         ]);
//         setAlarmData(alarms);
//       } catch (error) {
//         console.error("Erro ao buscar alarmes:", error);
//         setAlarmData([]);
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [selectedLine, ts],
//   );

//   // Efeito para buscar alarmes quando a seleção muda
//   useEffect(() => {
//     if (selection.originalIndex !== null) {
//       fetchAlarmsForHour(selection.originalIndex);
//     }
//   }, [selection.originalIndex, fetchAlarmsForHour]);

//   const selectHour = useCallback(
//     (hourLabel, filteredIndex) => {
//       const originalIndex = getOriginalIndex(filteredIndex);

//       setSelection({
//         hour: hourLabel,
//         filteredIndex,
//         originalIndex,
//       });
//     },
//     [getOriginalIndex],
//   );

//   const clearSelection = useCallback(() => {
//     setSelection({
//       hour: null,
//       filteredIndex: null,
//       originalIndex: null,
//     });
//     setAlarmData([]);
//   }, []);

//   return {
//     selection,
//     alarmData,
//     isLoadingAlarms: isLoading,
//     filteredData,
//     selectHour,
//     clearSelection,
//   };
// };

export const useHourSelection = (chartData, selectedLine, selectedShift) => {
  const [selection, setSelection] = useState({
    hour: null,
    filteredIndex: null,
    originalIndex: null,
  });

  const [alarmData, setAlarmData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { hours, ts, turnos } = chartData;

  // Filtra dados baseado no turno selecionado
  const filteredData = useMemo(() => {
    console.log("======================================");
    console.log("[FILTERED DATA]");
    console.log("selectedShift:", selectedShift);
    console.log("hours:", hours);
    console.log("turnos:", turnos);
    console.log("ts:", ts);

    if (!hours.length) {
      console.log("Sem horas");
      return { hours: [], ts: [], turnos: [], indices: [] };
    }

    if (selectedShift === "Todos") {
      const indices = Array.from({ length: hours.length }, (_, i) => i);

      console.log("Modo TODOS");
      console.log("indices:", indices);

      return {
        hours: [...hours],
        ts: [...ts],
        turnos: [...turnos],
        indices,
      };
    }

    const indices = turnos
      .map((turno, idx) => (turno === selectedShift ? idx : -1))
      .filter((idx) => idx !== -1);

    console.log("Modo turno filtrado");
    console.log("indices filtrados:", indices);

    return {
      hours: indices.map((idx) => hours[idx]),
      ts: indices.map((idx) => ts[idx]),
      turnos: indices.map((idx) => turnos[idx]),
      indices,
    };
  }, [selectedShift, hours, ts, turnos]);

  // Converte índice filtrado para índice original
  const getOriginalIndex = useCallback(
    (filteredIndex) => {
      console.log("======================================");
      console.log("[GET ORIGINAL INDEX]");
      console.log("filteredIndex:", filteredIndex);
      console.log("selectedShift:", selectedShift);
      console.log("filteredData.indices:", filteredData.indices);

      if (filteredIndex === null || filteredIndex === undefined) {
        console.log("filteredIndex inválido");
        return null;
      }

      if (selectedShift === "Todos") {
        console.log("Todos -> originalIndex =", filteredIndex);
        return filteredIndex;
      }

      if (filteredIndex >= 0 && filteredIndex < filteredData.indices.length) {
        const original = filteredData.indices[filteredIndex];

        console.log("originalIndex encontrado:", original);

        return original;
      }

      console.log("originalIndex NÃO encontrado");

      return null;
    },
    [selectedShift, filteredData.indices],
  );

  // Busca dados de alarmes para a hora selecionada
  const fetchAlarmsForHour = useCallback(
    async (originalIndex) => {
      console.log("======================================");
      console.log("[FETCH ALARMS]");
      console.log("selectedLine:", selectedLine);
      console.log("originalIndex:", originalIndex);

      if (!selectedLine || originalIndex === null || !ts[originalIndex]) {
        console.log("Abortando fetch");
        return;
      }

      console.log("ts original:", ts[originalIndex]);

      const [startHour, endHour] = ts[originalIndex];

      console.log("startHour RAW:", startHour);
      console.log("endHour RAW:", endHour);

      const THREE_HOURS = 3 * 60 * 60 * 1000;

      const startAdjusted = new Date(
        new Date(startHour).getTime() - THREE_HOURS,
      );

      const endAdjusted = new Date(new Date(endHour).getTime() - THREE_HOURS);
      // const startAdjusted = new Date(startHour);
      // const endAdjusted = new Date(endHour);

      console.log("startAdjusted:", startAdjusted);
      console.log("endAdjusted:", endAdjusted);

      console.log("startAdjusted ISO:", startAdjusted.toISOString());
      console.log("endAdjusted ISO:", endAdjusted.toISOString());

      setIsLoading(true);

      try {
        console.log("Chamando getCapAlarms...");

        const alarms = await getCapAlarms(selectedLine, [
          startAdjusted.toISOString(),
          endAdjusted.toISOString(),
        ]);

        console.log("ALARMES RETORNADOS:");
        console.log(alarms);

        setAlarmData(alarms);
      } catch (error) {
        console.error("Erro ao buscar alarmes:", error);
        setAlarmData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedLine, ts],
  );

  // Efeito para buscar alarmes quando a seleção muda
  useEffect(() => {
    console.log("======================================");
    console.log("[USE EFFECT]");
    console.log("selection:", selection);

    if (selection.originalIndex !== null) {
      fetchAlarmsForHour(selection.originalIndex);
    }
  }, [selection.originalIndex, fetchAlarmsForHour]);

  const selectHour = useCallback(
    (hourLabel, filteredIndex) => {
      console.log("======================================");
      console.log("[SELECT HOUR]");
      console.log("hourLabel:", hourLabel);
      console.log("filteredIndex:", filteredIndex);

      const originalIndex = getOriginalIndex(filteredIndex);

      console.log("originalIndex FINAL:", originalIndex);

      setSelection({
        hour: hourLabel,
        filteredIndex,
        originalIndex,
      });
    },
    [getOriginalIndex],
  );

  const clearSelection = useCallback(() => {
    console.log("======================================");
    console.log("[CLEAR SELECTION]");

    setSelection({
      hour: null,
      filteredIndex: null,
      originalIndex: null,
    });

    setAlarmData([]);
  }, []);

  return {
    selection,
    alarmData,
    isLoadingAlarms: isLoading,
    filteredData,
    selectHour,
    clearSelection,
  };
};

/**
 * Hook para gerenciar estado de UI (abas, modais, etc)
 */
export const useUIState = () => {
  const [activeTab, setActiveTab] = useState("lancamentos");
  const [showJustifyTab, setShowJustifyTab] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingHour, setPendingHour] = useState(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [selectedJustificativaId, setSelectedJustificativaId] = useState(null);

  const openJustifyTab = useCallback(() => {
    setActiveTab("justificar");
    setShowJustifyTab(true);
  }, []);

  const closeJustifyTab = useCallback(() => {
    setActiveTab("lancamentos");
    setShowJustifyTab(false);
  }, []);

  const openValidationModal = useCallback((id) => {
    setSelectedJustificativaId(id);
  }, []);

  const closeValidationModal = useCallback(() => {
    setSelectedJustificativaId(null);
  }, []);

  const requestHourChange = useCallback((hour, index) => {
    setPendingHour({ hour, index });
    setShowConfirmModal(true);
  }, []);

  const confirmHourChange = useCallback(
    (onConfirm) => {
      if (pendingHour && onConfirm) {
        onConfirm(pendingHour);
      }

      setPendingHour(null);
      setShowConfirmModal(false);
    },
    [pendingHour],
  );

  const cancelHourChange = useCallback(() => {
    setPendingHour(null);
    setShowConfirmModal(false);
  }, []);

  return {
    activeTab,
    setActiveTab,
    showJustifyTab,
    hasPendingChanges,
    setHasPendingChanges,
    selectedJustificativaId,
    openJustifyTab,
    closeJustifyTab,
    openValidationModal,
    closeValidationModal,
    pendingHour,
    showConfirmModal,
    requestHourChange,
    confirmHourChange,
    cancelHourChange,
  };
};

/**
 * Hook para gerenciar seleção de linhas na tabela
 */
export const useRowSelection = () => {
  const [selectedRows, setSelectedRows] = useState([]);
  const selectedRowsRef = useRef([]);

  const handleSelectionChange = useCallback((rows) => {
    setSelectedRows(rows);
    selectedRowsRef.current = rows;
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
    selectedRowsRef.current = [];
  }, []);

  const hasSelection = useCallback(
    () => selectedRowsRef.current.length > 0,
    [],
  );

  return {
    selectedRows,
    selectedRowsRef,
    hasSelection,
    handleSelectionChange,
    clearSelection,
  };
};

export const useMachines = (selectedLine) => {
  const [maquinas, setMaquinas] = useState([]);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await getCapListarMaquinas({ linha: selectedLine });

        // Verificamos se a resposta teve sucesso e se 'data' é um array
        if (response && response.success && Array.isArray(response.data)) {
          // Extraímos apenas a string do nome da máquina
          const listaNomes = response.data.map((m) => m.maquina);
          setMaquinas(listaNomes);
        } else {
          setMaquinas([]);
        }
      } catch (error) {
        console.error("Erro ao buscar máquinas:", error);
        setMaquinas([]);
      }
    };

    if (selectedLine) {
      fetchMachines();
    } else {
      setMaquinas([]); // Limpa a lista se não houver linha selecionada
    }
  }, [selectedLine]);

  return maquinas; // Retorna ["Máquina A", "Máquina B", ...]
};

export const useMantenedores = () => {
  const [mantenedores, setMantenedores] = useState([]);

  useEffect(() => {
    const fetchMantenedores = async () => {
      try {
        const response = await getCapListarMantenedores();

        if (response && response.success && Array.isArray(response.data)) {
          // Retorna o array completo com id e mantenedor
          setMantenedores(response.data);
        } else {
          setMantenedores([]);
        }
      } catch (error) {
        console.error("Erro ao buscar mantenedores:", error);
        setMantenedores([]);
      }
    };

    fetchMantenedores();
  }, []);

  return mantenedores; // Retorna [{ id: "1", mantenedor: "CARLOS SANTOS - MIG" }, ...]
};

export const useValidacoes = (selectedDate, selectedLine, selectedHour) => {
  const [lancamentos, setLancamentos] = useState([]);

  const fetchLancamentos = useCallback(async () => {
    try {
      const filtros = {
        linha: selectedLine,
        dataSelecionada: selectedDate,
        ...(selectedHour && { horaSelecionada: selectedHour }),
      };
      const resultados = await getCapListarJustificativas(filtros);
      console.log(resultados);
      setLancamentos(resultados);
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    }
  }, [selectedDate, selectedLine, selectedHour]);

  useEffect(() => {
    if (!selectedDate || !selectedLine) return;
    fetchLancamentos();
  }, [fetchLancamentos, selectedDate, selectedLine]);

  return { lancamentos, refetch: fetchLancamentos };
};

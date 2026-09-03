import { useState, useMemo, useCallback } from "react";

export const useReplayController = (replayData, pageMinutes = 10) => {
  const [currentPage, setCurrentPage] = useState(0);

  // 🔹 Timestamps globais, ordenados
  const allTimestamps = useMemo(() => {
    if (!replayData?.timestamps) return [];
    return [...replayData.timestamps].sort();
  }, [replayData]);

  // 🔹 Agrupa timestamps em páginas de X minutos
  const pages = useMemo(() => {
    if (!allTimestamps.length) return [];

    const result = [];
    let pageStart = new Date(allTimestamps[0]).getTime();
    let pageItems = [];

    allTimestamps.forEach((ts) => {
      const timestamp = new Date(ts).getTime();
      if (timestamp - pageStart < pageMinutes * 60 * 1000) {
        pageItems.push(ts);
      } else {
        result.push(pageItems);
        pageStart = timestamp;
        pageItems = [ts];
      }
    });

    if (pageItems.length) result.push(pageItems);

    return result;
  }, [allTimestamps, pageMinutes]);

  const totalPages = pages.length;

  const currentTimestamps = pages[currentPage] || [];

  const goNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => setCurrentPage(0), []);

  return {
    currentPage,
    totalPages,
    currentTimestamps,
    goNext,
    goPrev,
    reset,
  };
};

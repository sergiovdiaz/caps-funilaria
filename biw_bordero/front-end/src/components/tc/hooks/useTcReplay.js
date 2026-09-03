import { useState } from "react";
import { getTcHistory } from "../../../../api/tc.http";

export const useTcReplay = () => {
  const [replayData, setReplayData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReplay = async ({ line, startDate, endDate, st, maq }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getTcHistory({
        line,
        startDate,
        endDate,
        st,
        maq,
        type: "raw", //  FORÇA RAW
      });

      setReplayData(response.data);

      // depende da estrutura do seu backend:
      // { success: true, mode, data }
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    replayData,
    loading,
    error,
    fetchReplay,
  };
};

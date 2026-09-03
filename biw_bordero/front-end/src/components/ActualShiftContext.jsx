import React, { createContext, useContext, useState, useEffect } from "react";
import { listenActualShiftInfo } from "../../api/api";

const ActualShiftContext = createContext();

export const ActualShiftProvider = ({ children }) => {
  const [actualShift, setActualShift] = useState(null);

  useEffect(() => {
    listenActualShiftInfo((data) => {
      console.log("atualizao de turno: ", data);
      setActualShift(data.ActualShift);
    });
  }, []);

  return (
    <ActualShiftContext.Provider value={actualShift}>
      {children}
    </ActualShiftContext.Provider>
  );
};

export const useActualShift = () => useContext(ActualShiftContext);

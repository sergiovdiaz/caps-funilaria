import React from "react";
import StartStopPanel from "../components/StartStopPanel";

const CAStartStop = () => {
  return (
    <div className="CAStartStop">
      {/* <StartStopPanel lineStationMaq={"TES_ST_ST"} /> */}

      <StartStopPanel lineStationMaq={"AUE_ST_ST"} />
      <StartStopPanel lineStationMaq={"OFS_ST_ST"} />
      <StartStopPanel lineStationMaq={"FSA_ST_ST"} />
      <StartStopPanel lineStationMaq={"FPS_ST_ST"} />
      <StartStopPanel lineStationMaq={"FPD_ST_ST"} />

      <StartStopPanel lineStationMaq={"COF_ST_ST"} />
      <StartStopPanel lineStationMaq={"PRS_ST_ST"} />
      <StartStopPanel lineStationMaq={"PRD_ST_ST"} />

      <StartStopPanel lineStationMaq={"PPCD_ST_ST"} />
      <StartStopPanel lineStationMaq={"PPCS_ST_ST"} />
      <StartStopPanel lineStationMaq={"PPS_ST_ST"} />
      <StartStopPanel lineStationMaq={"PLCS_ST_ST"} />

      <StartStopPanel lineStationMaq={"OFD_ST_ST"} />
      <StartStopPanel lineStationMaq={"AUC_ST_ST"} />
      <StartStopPanel lineStationMaq={"FDA_ST_ST"} />
      <StartStopPanel lineStationMaq={"PLCD_ST_ST"} />
    </div>
  );
};

export default CAStartStop;

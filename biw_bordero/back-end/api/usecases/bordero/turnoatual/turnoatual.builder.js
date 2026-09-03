import {
  buildDate,
  buildAndon,
  buildBuffers,
  buildHourly,
  buildGeneralLosses,
  buildTableLosses,
} from "./builders.js";

import { actualShiftInfo } from "../../../shitfData.js";

export async function buildBorderoTurnoAtual(line) {
  const shiftInfo = actualShiftInfo();

  // const startAdj = new Date(
  //   new Date(shiftInfo?.StartTime).getTime() - 3 * 60 * 60 * 1000
  // );
  // const endAdj = new Date(
  //   new Date(shiftInfo?.EndTime).getTime() - 3 * 60 * 60 * 1000
  // );

  // return {
  //   date: await buildDate(),
  //   andon: await buildAndon(line),
  //   buffers: await buildBuffers(),
  //   hourly: await buildHourly(line, null, `TURNO ${shiftInfo?.ActualShift}`),
  //   general_losses: await buildGeneralLosses(line, startAdj, endAdj),
  //   table_losses: await buildTableLosses(line, startAdj, endAdj),
  // };

  const startAdj = new Date(
    new Date(shiftInfo?.StartTime).getTime() - 3 * 60 * 60 * 1000,
  );
  const endAdj = new Date(
    new Date(shiftInfo?.EndTime).getTime() - 3 * 60 * 60 * 1000,
  );

  return {
    date: await buildDate(),
    andon: await buildAndon(line),
    buffers: await buildBuffers(),
    hourly: await buildHourly(line, null, `TURNO ${shiftInfo?.ActualShift}`),
    general_losses: await buildGeneralLosses(
      line,
      shiftInfo?.StartTime,
      shiftInfo?.EndTime,
    ),
    table_losses: await buildTableLosses(
      line,
      shiftInfo?.StartTime,
      shiftInfo?.EndTime,
    ),
  };
}

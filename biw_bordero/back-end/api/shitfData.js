import { io } from "./server.js";
import { aggregationInterval } from "./productionData.js";

let shifts = {
  1: { start: "06:00", end: "15:48" },
  2: { start: "15:48", end: "01:09" },
  3: { start: "01:09", end: "06:00" },
};

let productionByLine = {};
let previousShift = null;
let shiftDuration = null;

const getCurrentShift = (now = new Date()) => {
  // const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 60 + minutes;

  for (let shift in shifts) {
    const { start, end } = shifts[shift];
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    // Se o turno atravessa a meia-noite
    if (endTime < startTime) {
      if (time >= startTime || time < endTime) {
        return shift;
      }
    }
    // Turno normal (não cruza meia-noite)
    else if (time >= startTime && time < endTime) {
      return shift;
    }
  }

  return null;
};

const initializeProductionData = (line, shift) => {
  if (!productionByLine[line]) {
    productionByLine[line] = {};
  }

  if (!productionByLine[line][shift]) {
    productionByLine[line][shift] = {
      Production: 0,
      TC: 0,
      TCList: [],
      LineSpeed: null,
    };
  }
};

const addShiftMessage = (newMsg) => {
  if (!newMsg || !newMsg.Line || !newMsg.Nseq || newMsg.TC === undefined) {
    console.log("Mensagem inválida recebida, ignorando:", newMsg);
    return;
  }

  const shift = getCurrentShift();
  if (!shift) return;

  initializeProductionData(newMsg.Line, shift);
  // console.log("actual shift info:", actualShiftInfo());

  const shiftData = productionByLine[newMsg.Line][shift];
  if (shiftData) {
    shiftData.Production += 1;
    shiftData.TCList.push(parseInt(newMsg.TC));
    if (shiftData.TCList.length > 500) {
      shiftData.TCList.shift();
    }
    const totalTC = shiftData.TCList.reduce((sum, current) => sum + current, 0);
    shiftData.TC = Math.round(totalTC / shiftData.TCList.length);
    shiftData.LineSpeed =
      shiftDuration >= aggregationInterval / 60
        ? shiftData.Production / shiftDuration
        : undefined;
  }
};

const getShiftMessages = (line = "ALL") => {
  const formattedMessages = [];

  const shift = getCurrentShift();
  if (!shift) return;

  for (let line in productionByLine) {
    initializeProductionData(line, shift);
    const lineData = productionByLine[line];
    const shiftMessages = {};

    actualShiftInfo();

    // Formatar os turnos para os dados de produção e TC
    Object.keys(lineData).forEach((shiftKey) => {
      const shiftData = lineData[shiftKey];
      shiftMessages[shiftKey] = {
        Production: shiftData.Production,
        TC: shiftData.TC,
        LineSpeed:
          shiftDuration >= aggregationInterval / 60
            ? shiftData.Production / shiftDuration
            : undefined,
      };
    });

    formattedMessages.push({
      Line: line,
      ...shiftMessages,
    });
  }
  // console.log(
  //   "shift data atualizado: ",
  //   formattedMessages.filter((msg) => msg.Line === line)
  // );
  return line === "ALL"
    ? formattedMessages
    : formattedMessages.filter((msg) => msg.Line === line);
};

const actualShiftInfo = () => {
  const currentShift = getCurrentShift();
  const now = new Date();

  if (!currentShift) return null;

  const { start, end } = shifts[currentShift];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  const startTime = new Date(now);
  startTime.setHours(startH, startM, 0, 0);

  let endTime = new Date(now);
  endTime.setHours(endH, endM, 0, 0);

  // Ajuste se o fim for no dia seguinte
  if (endTime < startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  // Ajuste também se o turno começou no dia anterior
  if (now < startTime) {
    startTime.setDate(startTime.getDate() - 1);
  }

  shiftDuration = ((now - startTime) / 1000 / 60 / 60).toFixed(2); // horas decimais

  return {
    ActualShift: currentShift,
    StartTime: startTime.toISOString(),
    EndTime: endTime.toISOString(),
    DurationInHours: shiftDuration,
  };
};

const resetProductionIfShiftChanged = () => {
  // actualShiftInfo;
  const currentShift = getCurrentShift();

  if (currentShift !== previousShift) {
    // Emite o atual shift para WebSocket se o turno mudar
    console.log("MUDOU O TURNO");
    const shiftInfo = actualShiftInfo();
    io.emit("actualshift/", shiftInfo); // Emitindo o evento 'actualshift' para todos os clientes conectados

    // Atualiza o turno anterior
    previousShift = currentShift;

    for (let line in productionByLine) {
      for (let shift in productionByLine[line]) {
        if (shift == currentShift) {
          productionByLine[line][shift].Production = 0;
          productionByLine[line][shift].TC = 0;
          productionByLine[line][shift].TCList = [];
          productionByLine[line][shift].LineSpeed = 0;
        }
      }
    }
  }
};

export {
  addShiftMessage,
  getShiftMessages,
  productionByLine,
  actualShiftInfo,
  resetProductionIfShiftChanged,
};

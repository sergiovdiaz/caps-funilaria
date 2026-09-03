// utils/chartUtils.js
export const prepareTipoMaquinaData = (data) =>
  data.tipoMaquina.map((item) => ({
    linestation: item.linestation,
    loss_min: item.loss_min,
  }));

export const prepareTopMaquinasData = (data) =>
  data.topMaquinas.map((item) => ({
    maquina: item.maquina,
    loss_min: item.loss_min,
  }));

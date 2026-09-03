import { getCurrentShift } from "../shift/utils/shift.utils.js";
import { dicModels, linhasModelosSimples } from "./constants/tc.constants.js";

export function buildTCContext(msg) {
  const { Plant, Shop = "BiW", Line, ST, Maq, _r, _st } = msg;

  if (!_r || !_r.length) throw new Error("Mensagem TC inválida: _r vazio");
  if (!Line || !ST || !Maq) throw new Error("Mensagem TC inválida: Line/ST/Maq ausentes");

  const record = _r[0];
  const tc = Number(record.TCData);
  const csald = record.CSALD;
  const cGood = record.C_Good;
  const nseq = record.Nseq;

  const eventDate = new Date(record._t || _st);
  const turno = getCurrentShift(eventDate).Shift;
  if (!turno) throw new Error("Não foi possível determinar o turno");

  // Escolhe nome do carro para a key do model
  let modeloName = "UNKNOWN";
  if (dicModels[csald]) {
    modeloName = linhasModelosSimples.includes(Line)
      ? dicModels[csald].Modelo
      : dicModels[csald].Tipo;
  }

  const basePath = `${Shop}:${Line}:${ST}:${Maq}`;

  return {
    meta: {
      plant: Plant,
      shop: Shop,
      line: Line,
      st: ST,
      maq: Maq,
      csald,
      modelo: modeloName,
      turno,
      timestamp: eventDate,
    },
    values: { tc, cGood, nseq },
    keys: {
      machine: {
        metrics: `tc:${basePath}:${turno}`,  // hash único por máquina+turno
        events: `tc:events:${basePath}:${turno}`,
      },
    },
  };
}

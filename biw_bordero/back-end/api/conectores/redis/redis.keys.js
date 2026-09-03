// redis.keys.js
export function shiftKeys({
  shop = "BiW",
  line = "*",
  shift = "*",
  st = "*",
  maq = "*",
}) {
  const shiftBase = `${shop}:${line}:${shift}`;
  const machineBase = `${shop}:${line}:${st}:${maq}`;

  return {
    // PRODUÇÃO
    productionShift: `prod:shift:${shiftBase}`,
    productionBucketBase: `prod:bucket:${shiftBase}`,
    productionIndex: `prod:idx:${shiftBase}`,

    // BUFFER
    buffer: `buffer:${shiftBase}`,

    // TC
    tcMachine: `tc:${machineBase}:${shift}`, // HASH da máquina
    tcEvents: `tc:events:${machineBase}:${shift}`, // LIST eventos
    tcIndex: `tc:index:${shiftBase}`, // SET índice por turno
    tcMeta: `tc:meta:${machineBase}`, // HASH meta máquina

    // OUTROS
    shiftInfo: `shift:info:${shop}:${shift}`,
    linestatus: `linestatus:${shop}:${line}`,
  };
}

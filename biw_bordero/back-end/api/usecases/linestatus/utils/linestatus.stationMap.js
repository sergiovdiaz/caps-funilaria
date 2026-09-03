let linestatusStationMap = new Map();

export function setLinestatusStations(maquinas) {
  linestatusStationMap = new Map();

  // Agrupa as STs por linha
  maquinas.forEach((m) => {
    const lista = linestatusStationMap.get(m.linha) || [];
    lista.push(m.st);
    linestatusStationMap.set(m.linha, lista);
  });
}

export function getLinestatusStationsByLinha(linha) {
  return linestatusStationMap.get(linha) || [];
}

export function getAllLinestatusStations() {
  return Array.from(linestatusStationMap.entries()).map(([linha, sts]) => ({ linha, sts }));
}
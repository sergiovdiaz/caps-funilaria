import {
  dicModels,
  linhasModelosSimples,
  modeloOrdenacao,
} from "./usecases/tc/constants/tc.constants.js";

let tcMessages = {};

const addTCMessage = (message) => {
  const { Line, ST, Maq, _r } = message;

  if (!Line || !ST || !Maq || !_r || !_r.length) {
    console.warn("Mensagem incompleta:", message);
    return;
  }

  const { CSALD } = _r[0];
  const modeloInfo = dicModels[CSALD];

  if (modeloInfo) {
    _r[0].Model = linhasModelosSimples.includes(Line)
      ? modeloInfo.Modelo
      : modeloInfo.Tipo;
  } else {
    _r[0].Model = "Unknown";
  }

  // Cria os níveis da estrutura se não existirem
  if (!tcMessages[Line]) {
    tcMessages[Line] = {};
  }

  if (!tcMessages[Line][ST]) {
    tcMessages[Line][ST] = {
      ST: [],
    };
  }

  if (!tcMessages[Line][ST][Maq]) {
    tcMessages[Line][ST][Maq] = [];
  }

  // Adiciona a mensagem em cada bucket correspondente
  tcMessages[Line][ST][Maq].push(message);

  const maxLength = Maq === "ST" ? 500 : 50;

  // Remove o primeiro elemento se passar do limite
  if (tcMessages[Line][ST][Maq].length > maxLength) {
    tcMessages[Line][ST][Maq].shift();
  }

  // console.log("Mensagem TC adicionada:", Line, ST, Maq);
  // console.log(tcMessages);
};

const getTCMessages = (shop, station, maq = "ST") => {
  // Verifica se existe o caminho completo antes de acessar
  if (
    tcMessages[shop] &&
    tcMessages[shop][station] &&
    tcMessages[shop][station][maq]
  ) {
    return tcMessages[shop][station][maq].slice(-10);
  }

  // Caso não exista, retorna um array vazio
  return [];
};

const getTCAnalytics2 = (shop, station, maq = "ST") => {
  const bucket = tcMessages?.[shop]?.[station]?.[maq];
  if (!bucket || !bucket.length) {
    return {};
  }

  const grouped = {};

  for (const msg of bucket) {
    const model = msg._r[0]?.Model;
    const tc = msg._r[0]?.TCData;
    if (!model || tc === undefined) continue;

    if (!grouped[model]) {
      grouped[model] = [];
    }
    grouped[model].push(tc);
  }

  const result = {};

  // Primeiro processamos os dados como antes
  for (const model in grouped) {
    const values = grouped[model].sort((a, b) => a - b);
    const counts = {};
    let moda = values[0],
      maxCount = 0;

    for (const v of values) {
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > maxCount) {
        maxCount = counts[v];
        moda = v;
      }
    }

    const mid = Math.floor(values.length / 2);
    const mediana =
      values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid];

    result[model] = {
      qtdModa: maxCount,
      moda,
      mediana,
    };
  }

  // Agora ordenamos o resultado final
  const orderedResult = {};

  // Criamos um array dos modelos ordenados
  const modelosOrdenados = Object.keys(result).sort((a, b) => {
    const ordemA = modeloOrdenacao[a.toUpperCase()] || 10; // Converte para uppercase e usa UNKNOWN como fallback
    const ordemB = modeloOrdenacao[b.toUpperCase()] || 10;
    return ordemA - ordemB;
  });

  // Populamos o novo objeto na ordem correta
  for (const model of modelosOrdenados) {
    orderedResult[model] = result[model];
  }

  return orderedResult;
};

export { tcMessages, addTCMessage, getTCMessages, getTCAnalytics2 };

import { Server } from "socket.io";

const productionMessages = []; // Lista para armazenar as mensagens recebidas

// Intervalo de agregação (em minutos) - 1 minuto por padrão
let aggregationInterval = 5;

// Janela de dados (em milissegundos) - 1 hora por padrão
let dataWindow = 60 * 60 * 1000 + aggregationInterval * 60 * 1000;

// let dataWindow = 1 * 60 * 1000;

// Função para arredondar o timestamp para o intervalo mais próximo
const roundToAggregationInterval = (timestamp) => {
  const date = new Date(timestamp);
  const minutes = date.getUTCMinutes();
  const roundedMinutes =
    Math.floor(minutes / aggregationInterval) * aggregationInterval;

  date.setUTCMinutes(roundedMinutes, 0, 0); // Define segundos e ms como 0
  return date.toISOString();
};

// Gera a lista de timestamps esperados dentro da janela de tempo
const generateExpectedTimestamps = () => {
  const now = new Date().getTime();
  const start = now - dataWindow;
  const timestamps = [];

  let current = start;
  while (current <= now) {
    timestamps.push(roundToAggregationInterval(current));
    current += aggregationInterval * 60000; // Avança para o próximo intervalo
  }

  return timestamps;
};

// Função para agrupar os dados por Line e por intervalo de tempo arredondado

const aggregateData = (line = "ALL") => {
  const now = new Date().getTime();
  const dataWindowAgo = now - dataWindow;

  // Filtra os dados dentro da janela de tempo configurada
  const recentData = productionMessages.map((msg) => {
    // Filtra os timestamps dentro da janela de tempo
    const filteredTimestamps = msg.TimestampsRaw.filter(
      (timestamp) => new Date(timestamp).getTime() > dataWindowAgo
    );

    // Retorna os dados, mas com TimestampsRaw filtrado
    return {
      ...msg,
      TimestampsRaw: filteredTimestamps,
    };
  });
  // Se line for diferente de "ALL", filtra os dados apenas para a linha específica
  const filteredData =
    line === "ALL" ? recentData : recentData.filter((msg) => msg.Line === line);

  // Obtém a lista de timestamps esperados
  const expectedTimestamps = generateExpectedTimestamps();

  // console.log("timestamp esperados: ", expectedTimestamps);

  // Inicializa a estrutura de agrupamento
  const groupedData = {};

  // Preenche a estrutura de agrupamento com 0 para todos os timestamps esperados
  filteredData.forEach((msg) => {
    if (!groupedData[msg.Line]) {
      groupedData[msg.Line] = {};
      expectedTimestamps.forEach((timestamp) => {
        groupedData[msg.Line][timestamp] = 0;
      });
    }
  });

  // console.log("expected ts: ", expectedTimestamps);

  // Popula a estrutura de agrupamento com os valores reais
  filteredData.forEach((msg) => {
    msg.TimestampsRaw.forEach((rawTimestamp) => {
      const roundedTimestamp = roundToAggregationInterval(rawTimestamp);
      if (groupedData[msg.Line]) {
        groupedData[msg.Line][roundedTimestamp] += 1;
      }
    });
  });

  // Transforma os objetos em arrays de {x=Timestamp, y=Production} para cada linha
  const formattedData = [];
  Object.keys(groupedData).forEach((line) => {
    const lineData = Object.entries(groupedData[line])
      .slice(1)
      .map(([timestamp, y]) => ({
        x: new Date(
          Date.parse(timestamp) + aggregationInterval * 60 * 1000
        ).toISOString(),
        y,
      }));

    formattedData.push({
      name: line, // Mantém o nome da linha
      data: lineData.sort((a, b) => new Date(a.x) - new Date(b.x)),
    });
  });

  return formattedData;
};
// Função para definir o intervalo de agregação
const setAggregationInterval = (newInterval) => {
  aggregationInterval = newInterval;
  console.log(
    `Intervalo de agregação alterado para ${aggregationInterval} minutos.`
  );
};

// Função para definir a janela de dados
const setDataWindow = (newWindow) => {
  dataWindow = newWindow * 60 * 1000; // Converte de minutos para milissegundos
  console.log(`Janela de dados alterada para ${newWindow} minutos.`);
};

// Adiciona uma nova mensagem na lista
const addMessage = (newMsg) => {
  if (!newMsg || !newMsg.Line) {
    console.log("Mensagem inválida recebida, ignorando:", newMsg);
    emitProductionDataUpdate(newMsg.Line);
    return;
  }

  const timestamp = new Date().toISOString(); // Timestamp UTC

  // Verifica se já existe um objeto de produção para a linha recebida
  let existingLine = productionMessages.find((msg) => msg.Line === newMsg.Line);

  if (existingLine) {
    // Se já existe, apenas adiciona o novo timestamp
    existingLine.TimestampsRaw.push(timestamp);

    if (existingLine.TimestampsRaw.length > 1500) {
      existingLine.TimestampsRaw.shift();
    }
  } else {
    // Se não existe, cria um novo objeto para a linha
    const message = {
      Line: newMsg.Line,
      TimestampsRaw: [timestamp],
    };
    productionMessages.push(message);
  }

  // // Se a lista ultrapassar 100 mensagens, remove a mais antiga
  // if (productionMessages.length > 100) {
  //   productionMessages.shift();
  // }

  // console.log("Nova mensagem armazenada:", productionMessages);
};

// Retorna os dados brutos recebidos antes da agregação
const getMessages = () => {
  return productionMessages;
};

// Retorna os dados agregados
const getAggregatedMessages = (line = "ALL") => aggregateData(line);

export {
  addMessage,
  getMessages,
  getAggregatedMessages,
  setAggregationInterval,
  setDataWindow,
  aggregationInterval,
};

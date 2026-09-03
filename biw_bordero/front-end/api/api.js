import { io } from "socket.io-client";
import { apiPost } from "./api.methods";
import { getToken } from "../src/contexts/authToken";

import { subscribeFms } from "./fms.socket";

const host = import.meta.env.VITE_HOST;
const port = import.meta.env.VITE_PORT;

const getCurrentPath = () => window.location.pathname;

export const apiUrl = `http://${host}:${port}`;

// Base URL do backend servindo as imagens
export const baseUrl = `http://${host}:${port}/savision`;

// Configuração da conexão com o servidor WebSocket
export const socket = io(`http://${host}:${port}`, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
  forceNew: false,
  transports: ["websocket", "polling"],
});

const subscribedLines = new Set(); // Conjunto para rastrear as linhas inscritas

// Função para se inscrever em uma linha específica no WebSocket
export const subscribeToLine = (line) => {
  if (!subscribedLines.has(line)) {
    socket.emit("subscribe", line);
    subscribedLines.add(line);
    console.log(
      `Inscrito nos tópicos: productiondata/${line} e shiftdata/${line}`,
    );
  } else {
    console.log(
      `Já está inscrito nos tópicos: productiondata/${line} e shiftdata/${line}`,
    );
  }
};

// Função para cancelar a inscrição de uma linha no WebSocket
export const unsubscribeFromLine = (line) => {
  if (subscribedLines.has(line)) {
    socket.off(`productiondata/${line}`);
    socket.emit("unsubscribe", line);
    subscribedLines.delete(line);
    console.log(`Desinscrito do tópico: productiondata/${line}`);
  }
};

// Função para reinscrever todas as linhas após uma reconexão do WebSocket
const resubscribeToAllLines = () => {
  subscribedLines.forEach((line) => {
    console.log(`Reinscrevendo na linha: ${line}`);
    subscribeToLine(line);
  });
};

// Evento acionado ao conectar/reconectar ao WebSocket
socket.on("connect", () => {
  console.log("Reconectado ao WebSocket! Reinscrevendo nas linhas...");
  console.log(getCurrentPath());
  resubscribeToAllLines();
  if (getCurrentPath() === "/monitoramentodefalhas") {
    subscribeFms();
  }
});

// Função para ouvir mensagens de produção de uma linha específica
export const listenToProductionData = (line, callback) => {
  const topic = `productiondata/${line}`;
  socket.off(topic); // Remove ouvintes antigos antes de adicionar novos
  socket.on(topic, (data) => {
    // console.log("Received production data", line); // Adicione o log aqui

    callback(data);
  });
};

// Função para ouvir dados de turno de uma linha específica
export const listenToShiftData = (line, callback) => {
  // Adicione o log aqui

  const topic = `shiftdata/${line}`;
  socket.off(topic); // Remove ouvintes antigos antes de adicionar novos
  socket.on(topic, (data) => {
    // console.log("Received shift data for line", data);
    callback(data);
  });
};

// Função para ouvir informações do turno atual
export const listenActualShiftInfo = (callback) => {
  const topic = "actualshift/";
  socket.emit("subscribeactualshift", topic);

  socket.off(topic); // Remove ouvintes antigos antes de adicionar novos
  socket.on(topic, (data) => {
    // console.log("Dados do turno atual recebidos:", data); // Verifique aqui os dados
    callback(data);
  });
};

export const listenTCData = (linestation, callback) => {
  const topic = `tcdata/${linestation}`;

  socket.off(topic); // Remove ouvintes antigos antes de adicionar novos
  socket.on(topic, (data) => {
    console.log("Received tc data line", data);
    callback(data);
  });
};

export const listenCAData = (lineStationMaq, callback) => {
  const topic = `cadata/${lineStationMaq}`;

  socket.off(topic); // Remove ouvintes antigos antes de adicionar novos
  socket.on(topic, (data) => {
    console.log("Received CA data for", lineStationMaq, data);
    callback(data);
  });
};

// Função para enviar uma mensagem e tópico para o backend
export const sendMessageToBackend = (topic, message) => {
  if (socket.connected) {
    socket.emit("sendMessage", { topic, message });
    console.log(`Mensagem enviada para o backend no tópico: ${topic}`);
  } else {
    console.error("WebSocket não está conectado.");
  }
};

// Função para confirmar a entrada de perdas
export const confirmLossInput = (data) => {
  return new Promise((resolve, reject) => {
    socket.emit("confirmarLancamentoPerda", data, (resposta) => {
      if (resposta) {
        resolve(resposta);
      } else {
        resolve(undefined);
      }
    });
  });
};

export const listarPerdasFunc = (data) => {
  return new Promise((resolve, reject) => {
    socket.emit("listarPerdas", data, (resposta) => {
      if (resposta) {
        resolve(resposta);
      } else {
        resolve(undefined);
      }
    });
  });
};

export const listarPerdas2dias = () => {
  return new Promise((resolve, reject) => {
    socket.emit("listarPerdas2dias", (resposta) => {
      if (resposta) {
        resolve(resposta);
      } else {
        resolve(undefined);
      }
    });
  });
};

export const selectPostgre = (data) => {
  return new Promise((resolve, reject) => {
    socket.emit("selectPostgre", data, (resposta) => {
      if (resposta) {
        resolve(resposta);
      } else {
        resolve(undefined);
      }
    });
  });
};

// Função para limpar todos os ouvintes e conexões WebSocket quando não forem mais necessários
export const cleanupSocket = () => {
  socket.removeAllListeners();
  socket.disconnect();
  console.log("WebSocket desconectado e ouvintes removidos.");
};

export const listenSavision = (usecase, callback) => {
  const room = `savision/${usecase}`;

  // Pede pro servidor entrar na sala
  socket.emit("join", room);

  // Remove listeners antigos desse evento
  socket.off("newdata");

  // Ouve o evento específico
  socket.on("newdata", (data) => {
    console.log(`Received new data from ${room}:`, data);

    // Ajusta os paths para o frontend
    const rawImage = `${baseUrl}/${data.img.replace(/\\/g, "/")}`;
    const predictImage = `${baseUrl}/${data.img_labeled.replace(/\\/g, "/")}`;

    data.info.koPercentage = (data.info.ko / data.info.total) * 100;
    data.info.okPercentage = (data.info.ok / data.info.total) * 100;

    // Envia os dados ajustados para o callback
    callback({
      ...data,
      rawImage,
      predictImage,
    });
  });
};

export const listenSavisionLastRows = (usecase, callback) => {
  // const room = `savision/${usecase}`;

  // // Pede pro servidor entrar na sala
  // socket.emit("join", room);

  // Remove listeners antigos desse evento
  socket.off("lastrows");

  // Ouve o evento específico
  socket.on("lastrows", (data) => {
    // Envia os dados ajustados para o callback
    callback(data);
  });
};

export const listenSavisionOverview = (usecase, callback) => {
  // Remove listeners antigos desse evento
  socket.off("overview");

  // Ouve o evento específico
  socket.on("overview", (data) => {
    console.log(`Received new data from last row  overview:`, data);

    // Envia os dados ajustados para o callback
    callback(data);
  });
};

export const unlistenSavision = (usecase) => {
  const room = `savision/${usecase}`;

  // pede pro servidor sair da sala
  socket.emit("leave", room);

  // remove listener específico dessa sala
  socket.off(`newdata`);
  socket.off(`lastrows`);
  socket.off(`overview`);

  console.log(`Desinscrito da sala ${room}`);
};

export const listenProductionReport = (lineName, date, callback) => {
  const room = `productionReport/${lineName}`;

  // Solicita ao servidor entrar na sala da linha
  socket.emit("joinProductionReport", lineName, date);

  // Remove listeners antigos para evitar duplicação
  socket.off("productionReportUpdate");

  // Recebe os dados do backend
  socket.on(`${room}/summary`, (data) => {
    console.log(`Received data from ${room}:`, data);

    // Chama o callback com os dados
    callback(data);
  });
};

// =========================
//      ROTAS DO CAP
// =========================

export async function getCapAlarms(line, timestampRange) {
  const start = timestampRange[0];
  const end = timestampRange[1];

  const url = `${apiUrl}/cap/alarms?line=${line}&start=${start}&end=${end}`;

  console.log("ENDPOINT: ", url);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Erro ao consultar CAP ALARMS");
  }

  const json = await res.json();

  console.log("Resposta da API de alarms:", json);

  return json.data;
}

export async function postCapJustificativa(data) {
  // console.log("postando");
  const url = `${apiUrl}/cap/justificativa`;
  console.log("dados pra salvar:", data);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Erro ao criar justificativa");
  }

  return res.json();
}

export async function getCapListarJustificativas(filtros = {}) {
  console.log("buscando justificativas...");

  // Remove campos nulos, undefined ou string vazia
  const filtrosLimpos = Object.fromEntries(
    Object.entries(filtros).filter(
      ([_, v]) => v !== null && v !== undefined && v !== "",
    ),
  );

  const queryString = new URLSearchParams(filtrosLimpos).toString();
  const url = `${apiUrl}/cap/justificativas${queryString ? `?${queryString}` : ""}`;

  console.log(url);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar justificativas");
  }

  const json = await res.json();

  // console.log("Resposta da API:", json);

  //
  return json.data;
}

// export async function getCapListarMaquinas(filtros = {}) {
//   console.log("buscando máquinas...");

//   // Constrói query string a partir do objeto de filtros
//   const queryString = new URLSearchParams(filtros).toString();
//   const url = `${apiUrl}/cap/maquinas${queryString ? `?${queryString}` : ""}`;
//   console.log(url);

//   const res = await fetch(url, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   if (!res.ok) {
//     throw new Error("Erro ao buscar máquinas");
//   }

//   const json = await res.json();

//   return json.data;
// }

// export async function getCapJustificativaById(id) {
//   if (!id) throw new Error("ID da justificativa não fornecido");

//   const url = `${apiUrl}/cap/justificativa/${id}`;
//   console.log(url);

//   const res = await fetch(url, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   if (!res.ok) {
//     if (res.status === 404) {
//       throw new Error("Justificativa não encontrada");
//     } else {
//       throw new Error("Erro ao buscar justificativa");
//     }
//   }

//   const json = await res.json();

//   return json.data; // { idJustificativa, historico }
// }

export async function getCapProd(line, date) {
  if (!line || !date) {
    throw new Error("Parâmetros line e date são obrigatórios");
  }

  const url = `${apiUrl}/cap/producao?line=${line}&date=${date}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar produção");
  }

  const data = await res.json();
  console.log("Resposta da API de produção:", data);
  return data.data; // { success: true, data: resultado }
}

export const listenCapOnlineProd = (line, callback) => {
  const room = `capproddata/${line}`;

  // Inscreve na sala da linha
  socket.emit("subscribecapproddata", line);

  // Remove listeners antigos desse evento
  socket.off(room);

  // Ouve a sala específica
  socket.on(room, (data) => {
    // console.log(`📩 Recebido capproddata de ${room}:`, data);

    // Manda direto pro callback
    callback(data);
  });
};

export const unlistenCapOnlineProd = (line) => {
  const room = `capproddata/${line}`;

  // Pede pro servidor sair da sala
  socket.emit("unsubscribecapproddata", line);

  // Remove todos os listeners dessa sala específica
  socket.off(room);

  console.log(`❌ Desinscrito da sala ${room}`);
};

export async function getCapListarValidacoesPendentes(filtros = {}) {
  console.log("buscando validações pendentes...");

  // Remove campos nulos, undefined ou string vazia
  const filtrosLimpos = Object.fromEntries(
    Object.entries(filtros).filter(
      ([_, v]) => v !== null && v !== undefined && v !== "",
    ),
  );

  const queryString = new URLSearchParams(filtrosLimpos).toString();
  const url = `${apiUrl}/cap/validacao/pendencias${queryString ? `?${queryString}` : ""}`;
  console.log(url);

  console.log(url);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar justificativas");
  }

  return res.json();
}

export async function getCapListarJustificativasPendentes(filtros = {}) {
  console.log("buscando Justificativas pendentes...");

  // Remove campos nulos, undefined ou string vazia
  const filtrosLimpos = Object.fromEntries(
    Object.entries(filtros).filter(
      ([_, v]) => v !== null && v !== undefined && v !== "",
    ),
  );

  const queryString = new URLSearchParams(filtrosLimpos).toString();
  const url = `${apiUrl}/cap/justificativas/pendencias${queryString ? `?${queryString}` : ""}`;
  console.log(url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar justificativas");
  }

  return res.json();
}

/**
 * Faz login do usuário
 * @param {string} matricula
 * @param {string} senha
 * @returns {Promise<{ usuario: object, accessToken: string, refreshToken: string }>}
 */
export async function loginUser(matricula, senha) {
  if (!matricula || !senha) {
    throw new Error("Matrícula e senha são obrigatórios");
  }

  try {
    const res = await fetch(`${apiUrl}/authentication/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matricula, senha }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Erro ao fazer login");
    }

    const data = await res.json();

    // Armazenar tokens de forma segura (exemplo: sessionStorage)
    sessionStorage.setItem("accessToken", data.accessToken);
    sessionStorage.setItem("refreshToken", data.refreshToken);

    return data; // { usuario, accessToken, refreshToken }
  } catch (err) {
    console.error("Login falhou:", err.message);
    throw err;
  }
}

/**
 * Faz logout do usuário
 */
export function logoutUser() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  // opcional: chamar endpoint /logout do backend para invalidar refresh token
}

export async function registerUser({ matricula, nome, sobrenome, area }) {
  if (!matricula || !nome || !sobrenome || !area) {
    throw new Error("Todos os campos são obrigatórios");
  }

  try {
    const res = await fetch(`${apiUrl}/authentication/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matricula, nome, sobrenome, area }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Erro ao cadastrar usuário");
    }

    const data = await res.json();

    // Opcional: você pode armazenar algum token aqui se a rota já gerar login automático
    // sessionStorage.setItem("accessToken", data.accessToken);

    return data; // { usuario, message }
  } catch (err) {
    console.error("Cadastro falhou:", err.message);
    throw err;
  }
}

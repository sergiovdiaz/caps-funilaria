import "../config/env.js";
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { createServer, get } from "http";
import { Server } from "socket.io";
import { actualShiftInfo } from "./shitfData.js";
import "./conectores/mqtt/mqtt.connector.js"; // Garante que o MQTT conecte ao iniciar o servidor

import { getTCMessages, getTCAnalytics2 } from "./tcData.js";
import { getCAMessages } from "./caData.js";

import authenticationRouter from "./authentication.js";
import pcmRouter from "./server/http/routes/pcm.routes.js";
import capRouter from "./server/http/routes/cap.routes.js";
import machineLedgerRouter from "./server/http/routes/machineledger.routes.js";
import borderoRouter from "./server/http/routes/bordero.routes.js";
import tcRouter from "./server/http/routes/tc.routes.js";
import weldingRouter from "./server/http/routes/weldingreport.routes.js";
import ldaRouter from "./server/http/routes/lda.routes.js";
import defeitosRouter from "./server/http/routes/defeitos.routes.js";

import { buildBorderoTurnoAtual } from "./usecases/bordero/turnoatual/turnoatual.builder.js";
import {
  buildActiveFaults,
  buildHistoryFaults,
} from "./usecases/fms/builders.js";
import {
  updateAlarmNotification,
  startFmsPolling,
  stopFmsPolling,
} from "./usecases/fms/fms.service.js";

import { buildBorderoDiario } from "./usecases/bordero/diario/diario.builder.js";
import { scheduleDaily, scheduleEvery } from "./server/schedule/scheduler.js";
import { resetAllShiftMetrics } from "./usecases/shift/shift.reset.js";
import { emitProductionData } from "./usecases/production/production.emitter.js";
import { emitProductivityUpdate } from "./usecases/shift/shift.emitter.js";
import { getTCAnalytics } from "./usecases/tc/tc.queries.js";
import { loadShiftRules } from "./usecases/shift/shift.pgService.js";
import {
  clearProductionShift,
  ensureShiftInfo,
} from "./usecases/shift/shift.init.js";
import { emitBufferUpdate } from "./usecases/buffers/buffers.emitter.js";
import { initLinestatusRules } from "./usecases/linestatus/linestatus.init.js";
import { emitLinestatusUpdate } from "./usecases/linestatus/linestatus.emitter.js";
import { startAndonSchedulers } from "./usecases/shift/shift.scheduler.js";
import { setSourceMapsEnabled } from "process";

// import { manusisService } from "./conectores/manusis/manusis.router.js";

// Simula __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Criando o servidor HTTP
const server = createServer(app);

// Configuração do Socket.IO com CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Aceitar qualquer origem
    methods: ["GET", "POST"], // Permitir GET e POST
  },
});

// Middlewares
app.use(cors());
app.use(express.json());
// app.use("/savision", express.static("C:/savision"));

// Rota inicial
// app.get("/api", (req, res) => {
//   res.send("Só vamos trabalhar com os endpoints '/producao'");
// });

// Outras rotas
app.use("/authentication", authenticationRouter);

// rotas
/*
POST   /authentication/login
POST   /authentication/logout
PUT    /authentication/edit
PUT    /authentication/change-password
*/

app.use("/pcm", pcmRouter);
app.use("/cap", capRouter);
app.use("/machineledger", machineLedgerRouter);
app.use("/bordero", borderoRouter);
app.use("/tc", tcRouter);
app.use("/welding", weldingRouter);
app.use("/lda", ldaRouter);
app.use("/defeitos", defeitosRouter);

// //GET HISTORICO TC

// app.get("/tc/history", async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       line,
//       st = null,
//       maq = "ST",
//       type = "processed", //  novo parâmetro
//     } = req.query;

//     console.log("Solcitado: ", req.query);
//     if (!line || !startDate || !endDate) {
//       return res.status(400).json({
//         error: "Parâmetros obrigatórios: line, startDate, endDate",
//       });
//     }

//     let data;

//     if (type === "raw") {
//       // histórico cru (para replay)
//       data = await getHistoryTCRaw({
//         line,
//         startDate,
//         endDate,
//         st,
//         maq,
//       });
//     } else {
//       //  histórico processado (padrão atual)
//       data = await getHistoryTC({
//         line,
//         startDate,
//         endDate,
//         st,
//         maq,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       mode: type,
//       data,
//     });
//   } catch (error) {
//     console.error("Erro ao buscar histórico de TC:", error);
//     return res.status(500).json({
//       error: "Erro interno ao buscar histórico de TC",
//     });
//   }
// });

// Função para inscrever cliente em múltiplos tópicos
const subscribeToTopics = (socket, line) => {
  const topics = [`productiondata/${line}`, `shiftdata/${line}`];

  topics.forEach((topic) => {
    socket.join(topic);
    socket.emit("subscribed", topic); // Confirma inscrição
  });
};

// Configuração do WebSocket para conexões de clientes
io.on("connection", (socket) => {
  console.log("Novo cliente conectado ao WebSocket");

  // Inscrever o cliente nos tópicos quando ele solicitar
  socket.on("subscribe", (line) => {
    subscribeToTopics(socket, line);
    emitProductionData(line, socket); // Emite dados imediatamente após a inscrição
    emitProductivityUpdate(line, socket); // Emite dados de turno imediatamente após a inscrição
  });
  socket.on("subscribeactualshift", (line) => {
    socket.join("actualshift/");
    const shiftInfo = actualShiftInfo(); // Obtém a informação do turno atual
    if (shiftInfo) {
      socket.emit("actualshift/", shiftInfo); // Envia a informação do turno para o cliente que se inscreveu
      console.log("emitando dados de turno");
    }
  });

  socket.on("subscribetcdata", (linestationmaq) => {
    const topic = `tcdata/${linestationmaq}`;
    socket.join(topic);

    // A estação sempre tem 5 caracteres e começa com "ST"
    const stIndex = linestationmaq.indexOf("ST");
    const station = linestationmaq.slice(stIndex, stIndex + 5); // ex: ST100
    const line = linestationmaq.slice(0, stIndex); // ex: AUC
    const maq = linestationmaq.slice(stIndex + 5); // ex: ST ou 020R01

    socket.emit(topic, {
      dados: getTCMessages(line, station, maq),
      analytics: getTCAnalytics2(line, station, maq),
    });
    // console.log("TC INSCRIÇÃO ", topic);
    socket.emit("subscribed", topic);
  });

  socket.on("unsubscribetcdata", (linestation) => {
    const topic = `tcdata/${linestation}`;
    socket.leave(topic);
    // console.log("TC DESINSCRIÇÃO ", topic);
  });

  // Desinscrição de cliente de um tópico
  socket.on("unsubscribe", (line) => {
    // console.log(`Cliente desinscrito do tópico: productiondata/${line}`);
    socket.leave(`productiondata/${line}`);
  });

  socket.on("subscribeCAdata", (lineStationMaq) => {
    const [line, station, maq] = lineStationMaq.split("_");

    const topic = `cadata/${lineStationMaq}`;
    socket.join(topic);

    const dados = getCAMessages(line, station, maq);

    // console.log("ca dados emitidos: ", dados);
    socket.emit(topic, dados);
    console.log(`Inscrição CA para ${topic}`);
  });

  socket.on("unsubscribecadata", (line) => {
    const topic = `cadata/${line}`;
    socket.leave(topic);
    console.log("CADESINSCRIÇÃO ", topic);
  });

  // SUBSCRIBE CAPPRODDATA
  // socket.on("subscribecapproddata", async (line) => {
  //   try {
  //     const topic = `capproddata/${line}`;
  //     socket.join(topic);
  //     const agora = new Date();
  //     console.log("data agora é: ", agora);

  //     // subtrai 1 hora e 9 minutos
  //     agora.setHours(agora.getHours() - 1);
  //     agora.setMinutes(agora.getMinutes() - 9);

  //     // formata para yyyy-mm-dd
  //     const date = agora.toISOString().split("T")[0];

  //     const dados = await getCapProd(line, date);

  //     socket.emit(topic, dados);
  //     socket.emit("subscribed", topic);
  //   } catch (err) {
  //     console.error("Erro ao se inscrever em capproddata:", err);

  //     socket.emit("error", {
  //       message: "Erro ao realizar a inscrição em capproddata",
  //       detail: err.message,
  //     });
  //   }
  // });

  // UNSUBSCRIBE CAPPRODDATA
  socket.on("unsubscribecapproddata", (line) => {
    const topic = `capproddata/${line}`;
    socket.leave(topic);

    // Opcional: avisar que saiu
    // socket.emit("unsubscribed", topic);
  });

  socket.on("join", async (topic) => {
    socket.join(topic);
    // console.log("Inscrito no topic: ", topic);
    socket.emit("subscribed", topic);

    try {
      // Caminho da pasta info
      const { infoDir } = getSavisionDirs();

      // Lê todos os arquivos JSON da pasta
      const files = await fs.readdir(infoDir);

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(infoDir, file);
          const fileData = await fs.readFile(filePath, "utf-8");
          const jsonData = JSON.parse(fileData);

          // Envia para o cliente via Socket.IO
          io.to(topic).emit("newdata", jsonData);
        }

        io.to(topic).emit("lastrows", await getLastPuntoneRows());

        io.to(topic).emit("overview", await getPuntoneOverview());
        console.log("emitido");
      }
    } catch (err) {
      console.error("Erro ao ler JSONs do infoDir:", err);
    }
  });

  socket.on("leave", (room) => {
    socket.leave(room);
    // console.log(`Cliente ${socket.id} saiu da sala ${room}`);
    socket.emit("unsubscribed", room);
  });

  // Desconexão do cliente
  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });

  socket.on("bordero", async (msg) => {
    const { action, view, line, date } = msg || {};
    if (!action || !view || !line) return;

    const room = `bordero:${view}:${line}`;

    if (action === "subscribe") {
      socket.join(room);
      console.log(`SUBSCRIBE → ${room}`);

      try {
        let dados = null;

        if (view === "turnoatual") {
          dados = await buildBorderoTurnoAtual(line);
        }

        if (view === "daily") {
          if (!date) {
            socket.emit("bordero:error", {
              view,
              line,
              message: "Data obrigatória para visão diária",
            });
            return;
          }

          dados = await buildBorderoDiario(line, date);
        }

        if (dados) {
          io.to(room).emit("bordero:update", {
            view,
            line,
            date: date ?? null,
            dados,
          });
        }
      } catch (err) {
        console.error("Erro ao montar borderô:", err);

        socket.emit("bordero:error", {
          view,
          line,
          message: "Erro ao montar borderô",
        });
      }
    }

    if (action === "unsubscribe") {
      socket.leave(room);
      console.log(`UNSUBSCRIBE → ${room}`);
    }
  });

  socket.on("fms", async (msg) => {
    const { action, alarmId, nivel, comment, token, line } = msg || {};
    console.log(msg);

    // =========================
    // LOGIN → token enviado no msg
    // =========================
    if (token && !socket.user) {
      try {
        console.log("entrooou");
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = payload; // salva info do usuário no socket
        socket.emit("fms:auth_success", payload);
        console.log("Usuário autenticado no WebSocket:", payload.matricula);
      } catch (err) {
        console.log(err);
        return socket.emit("fms:auth_error", "Token inválido");
      }
    }

    const room = "fms";

    // =========================
    // SUBSCRIBE → envia todos os alarmes ativos
    // =========================
    if (action === "subscribe") {
      socket.join(room);
      console.log(`SUBSCRIBE → ${room}`);

      startFmsPolling(io);

      try {
        const dados = await buildActiveFaults(); // pega alarmes ativos
        const history = await buildHistoryFaults();

        io.to(room).emit("fms:update", {
          ativo: dados,
          historico: history,
        });

        // console.log({
        //   ativo: dados,
        //   historico: history,
        // });
      } catch (err) {
        console.error("Erro buildActiveFaults:", err);
        socket.emit("fms:error", {
          message: "Erro ao buscar alarmes ativos",
        });
      }
    }

    // =========================
    // UNSUBSCRIBE → sai da room
    // =========================
    if (action === "unsubscribe") {
      socket.leave(room);
      console.log(`UNSUBSCRIBE → ${room}`);

      const roomSize = io.sockets.adapter.rooms.get("fms")?.size || 0;
      if (roomSize === 0) {
        stopFmsPolling();
      }
    }

    // =========================
    // UPDATE → alterar nível ou adicionar comentário
    // =========================
    if (action === "update") {
      if (!socket.user) {
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          socket.user = payload; // salva info do usuário no socket
          socket.emit("fms:auth_success", payload);
          console.log("Usuário autenticado no WebSocket:", payload.matricula);
        } catch (err) {
          console.log("problema");
          return socket.emit("fms:auth_error", "Token inválido");
        }
      }

      if (alarmId && nivel) {
        try {
          console.log("oi");
          await updateAlarmNotification({
            alarmId,
            nivel,
            comment,
            matricula: socket.user.matricula,
          }); // passa a matricula

          // envia atualização para todos na room
          const dados = await buildActiveFaults();
          io.to(room).emit("fms:update", {
            ativo: dados,
          });
        } catch (err) {
          console.error("Erro ao atualizar alarme:", err);
          socket.emit("fms:error", {
            message: "Erro ao atualizar alarme",
          });
        }
      }
    }

    // =========================
    // GETID → busca alarme específico pelo id
    // =========================
    if (action === "getId" && alarmId) {
      try {
        const alarme = await getAlarmById(alarmId);
        socket.emit("fms:getId", alarme);
      } catch (err) {
        console.error("Erro ao buscar alarme:", err);
        socket.emit("fms:error", {
          message: `Erro ao buscar alarme ${alarmId}`,
        });
      }
    }
  });

  socket.on("sinopticoAndon", async (msg) => {
    const { action, view, line } = msg || {};
    if (!action || !line || !view) return;

    const room = `sinopticoAndon:${view}:${line}`;

    if (action === "subscribe") {
      socket.join(room);
      console.log(`SUBSCRIBE → ${room}`);

      try {
        //  PRODUCTIVITY
        if (view === "productivity") {
          await emitProductivityUpdate(line, { type: "SNAPSHOT", socket });
        }

        //  BUFFER
        if (view === "buffer") {
          console.log("emitindo snapshot do buffer para ", line);
          await emitBufferUpdate(line, {
            type: "SNAPSHOT",
            socket,
          });
        }

        //  STATION
        if (view === "station") {
          const tc = await getTCAnalytics({
            line,
            stations: [{ maq: "ST" }],
          });

          socket.emit("sinopticoAndon:update", {
            type: "SNAPSHOT",
            view,
            line,
            timestamp: new Date().toISOString(),
            payload: tc.machines || [],
          });
        }

        //  LINESATUS
        if (view === "linestatus") {
          await emitLinestatusUpdate(line, {
            type: "SNAPSHOT",
            socket,
          });
        }
      } catch (err) {
        console.error("Erro no snapshot:", err);
      }
    }

    if (action === "unsubscribe") {
      socket.leave(room);
      console.log(`UNSUBSCRIBE → ${room}`);
    }
  });
});

// Iniciando o servidor na porta definida
server.listen(PORT, () => {
  console.log(`Servidor escutando na porta ${PORT}`);
});

await loadShiftRules();
await initLinestatusRules();

await ensureShiftInfo({ mode: "overwrite" }); // Garante que haja um turno atual definido ao iniciar o servidor
await clearProductionShift(); // Limpa os dados de produção do turno anterior ao iniciar o servidor

scheduleDaily(1, 9, resetAllShiftMetrics);
scheduleDaily(6, 0, resetAllShiftMetrics);
scheduleDaily(15, 48, resetAllShiftMetrics);

startAndonSchedulers();

export { io };

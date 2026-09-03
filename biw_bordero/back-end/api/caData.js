let caMessages = {};

const addCAMessage = (message) => {
  const { Output, Flow, ...otherAttributes } = message; // Extrai Output e Flow, o resto vai para otherAttributes

  if (!caMessages[message.Line]) caMessages[message.Line] = {};
  if (!caMessages[message.Line][message.Station])
    caMessages[message.Line][message.Station] = {};
  if (!caMessages[message.Line][message.Station][message.Machine]) {
    caMessages[message.Line][message.Station][message.Machine] = {
      Output: Output,
      Data: {
        Timestamp: [],
        Flow: [],
      },
      Ultimo_status: null,
      Attributes: {
        Line: message.Line,
        Station: message.Station,
        Machine: message.Machine,
        ...otherAttributes, // Inclui todos os outros atributos aqui
      },
    };
  }

  const registro = caMessages[message.Line][message.Station][message.Machine];
  const now = new Date();

  // Detecta mudança de comando
  const comandoAnterior = registro.Output;

  // Atualiza o comando atual
  registro.Output = Output;

  // Atualiza todos os atributos (incluindo Line, Station e Machine)
  registro.Attributes = {
    Line: message.Line,
    Station: message.Station,
    Machine: message.Machine,
    ...otherAttributes,
    Output: message.Output,
  };

  // Adiciona dados de tempo e fluxo
  registro.Data.Timestamp.push(now.toISOString());
  registro.Data.Flow.push(Number(Flow?.toFixed(1)));

  // Limita a 60 registros
  if (registro.Data.Timestamp.length > 60) registro.Data.Timestamp.shift();
  if (registro.Data.Flow.length > 60) registro.Data.Flow.shift();

  // Lógica medidor de vazao KO
  if (!isNaN(registro?.Data?.Flow?.at(-1))) {
    if (Output === false && registro.Data.Timestamp.length >= 8) {
      const flow = registro.Data.Flow.slice(-5);
      const sum = flow.reduce((acc, val) => acc + val, 0);
      const average = sum / flow.length;

      if (average < 0) {
        if (registro.Ultimo_status?.Status != "Sem medição de vazão") {
          registro.Ultimo_status = {
            Start: now.toISOString(),
            End: null,
            Dur: undefined,
            Status: "Sem medição de vazão",
          };
        }
      } else {
        if (registro.Ultimo_status?.Status == "Sem medição de vazão")
          registro.Ultimo_status = undefined;
      }
    }
  } else {
    registro.Ultimo_status = {
      Start: now.toISOString(),
      End: null,
      Dur: undefined,
      Status: "Sem medição de vazão",
    };
  }

  if (registro.Ultimo_status?.Status != "Sem medição de vazão") {
    // Lógica de status
    if (comandoAnterior === false && Output === true) {
      // Início de um novo evento
      registro.Status_anterior = registro.Ultimo_status;
      registro.Ultimo_status = {
        Start: now.toISOString(),
        End: null,
        Dur: undefined,
        Status: "Em andamento",
      };
    } else if (comandoAnterior === true && Output === false) {
      // Fim do evento
      if (registro.Ultimo_status?.Start) {
        const start = new Date(registro.Ultimo_status.Start);
        const duracaoMin = Math.round((now - start) / 60000); // duração em minutos

        registro.Ultimo_status.End = now.toISOString();
        registro.Ultimo_status.Dur = duracaoMin;
        if (duracaoMin > 9) {
          if (registro.Ultimo_status?.Status != "Comando em bypass") {
            registro.Ultimo_status.Status =
              "Energy Saving realizado com sucesso!";
          }
        } else registro.Ultimo_status = registro.Status_anterior;
      }
    }

    // Lógica de análise de "Comando em bypass"
    if (Output === true && registro.Data.Timestamp.length >= 8) {
      const timestamps = registro.Data.Timestamp;
      const flow = registro.Data.Flow;
      // console.log("msg ca é: ", message);
      const startTime = new Date(registro.Ultimo_status.Start);

      // Encontrar o índice do primeiro ponto após ou igual ao Start
      const indexStart = timestamps.findIndex(
        (timestamp) => new Date(timestamp) >= startTime
      );

      // Verificar se há dados suficientes antes e depois
      if (indexStart >= 5) {
        const flowAntes = flow.slice(indexStart - 5, indexStart); // 5 pontos antes

        // Pegar todos os pontos após o indexStart (inclusive)
        const flowAposTodos = flow.slice(indexStart + 1);

        // Verificar se há pelo menos 3 pontos após o start
        if (flowAposTodos.length >= 10) {
          const flowDepois = flowAposTodos.slice(-3); // últimos 3 pontos após o start
          const flowPrimeiros = flowAposTodos.slice(0, 9);

          const mediaAntes =
            flowAntes.reduce((acc, val) => acc + val, 0) / flowAntes.length;
          const mediaDepois =
            flowDepois.reduce((acc, val) => acc + val, 0) / flowDepois.length;

          if (mediaDepois > mediaAntes * 0.5) {
            registro.Ultimo_status.Status = "Comando em bypass";
          } else {
            registro.Ultimo_status.Status = "Em andamento";
          }

          // Verifica se os 9 valores são iguais
          const [a, b, c, d, e, f, g, h, i] = flowPrimeiros;
          if (
            a == b &&
            a == c &&
            a == d &&
            a == e &&
            a == f &&
            a == g &&
            a == h &&
            a == i
          ) {
            registro.Ultimo_status.Status = "Em andamento";
          }
        }

        // console.log(caMessages[message.Line][message.Station][message.Machine]);
      }
    }
  }
};

const getCAMessages = (line, station, maq) => {
  if (
    caMessages[line] &&
    caMessages[line][station] &&
    caMessages[line][station][maq]
  ) {
    return caMessages[line][station][maq];
  }
  return {};
};

export { addCAMessage, getCAMessages, caMessages };

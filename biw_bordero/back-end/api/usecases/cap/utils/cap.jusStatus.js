export const STATUS = {
  PENDENTE_VALIDACAO: 0,
  EM_REVISAO: 1,
  FINALIZADA: 2,
  EM_ESPERA: 3,
};

//  Transições permitidas
export const TRANSITIONS = {
  [STATUS.PENDENTE_VALIDACAO]: [STATUS.EM_REVISAO, STATUS.FINALIZADA],

  [STATUS.EM_REVISAO]: [
    STATUS.PENDENTE_VALIDACAO,
    STATUS.FINALIZADA,
    STATUS.EM_ESPERA, //  nova transição possível
  ],

  [STATUS.EM_ESPERA]: [
    STATUS.PENDENTE_VALIDACAO, // quando alguém assume novamente
    STATUS.EM_REVISAO, // se voltar pra produção revisar
  ],

  [STATUS.FINALIZADA]: [],
};

export function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to);
}

export function validateTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`Transição inválida: ${from} → ${to}`);
  }
}

export function getNextState({
  statusAtual,
  mudouCausaRaiz,
  responsavelAtual,
  novoResponsavel,
  qtdTrocasResponsavel = 0,
}) {
  let nextStatus;
  let validador = null;

  const mudouResponsavel =
    mudouCausaRaiz && novoResponsavel !== responsavelAtual;

  const jaTeveTroca = qtdTrocasResponsavel > 1;

  // ─────────────────────────────
  // PENDENTE_VALIDAÇÃO
  // ─────────────────────────────
  if (statusAtual === STATUS.PENDENTE_VALIDACAO) {
    if (mudouResponsavel) {
      if (jaTeveTroca) {
        // NOVA REGRA
        nextStatus = STATUS.EM_ESPERA;
      } else {
        nextStatus = STATUS.EM_REVISAO;
        validador = "PRODUÇÃO";
      }
    } else {
      nextStatus = STATUS.FINALIZADA;
    }
  }

  // ─────────────────────────────
  // EM_REVISÃO
  // ─────────────────────────────
  else if (statusAtual === STATUS.EM_REVISAO) {
    if (!mudouCausaRaiz) {
      if (responsavelAtual === "PRODUÇÃO") {
        nextStatus = STATUS.FINALIZADA;
      } else {
        nextStatus = STATUS.PENDENTE_VALIDACAO;
        validador = responsavelAtual;
      }
    } else {
      if (novoResponsavel === "PRODUÇÃO") {
        nextStatus = STATUS.FINALIZADA;
      } else if (mudouResponsavel) {
        if (jaTeveTroca) {
          nextStatus = STATUS.EM_ESPERA;
        } else {
          nextStatus = STATUS.PENDENTE_VALIDACAO;
          validador = novoResponsavel;
        }
      } else {
        nextStatus = STATUS.FINALIZADA;
      }
    }
  } else {
    throw new Error("Transição inválida");
  }

  return { nextStatus, validador, mudouResponsavel };
}

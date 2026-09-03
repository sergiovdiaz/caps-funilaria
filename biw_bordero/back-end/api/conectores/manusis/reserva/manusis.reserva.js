// handlers/machineledger/reserva.handler.js
// import { v4 as uuidv4 } from "uuid";
import { redisService } from "../../redis/redis.service.js";
import {
  buscarAssetPorCodigo,
  criarOrdemManutencao,
  criarAtividadeOrdem,
  criarReservaMaterial,
  consultarReservaPorId,
} from "./manusis.reserva.operacoes.js";
import { randomUUID } from "crypto";
// Armazena jobs ativos de monitoramento
const monitoringJobs = new Map();
import { getMaterialByCode } from "../handlers/machineledger.handler.js";

// ============================================================
// FUNÇÃO AUXILIAR: Extrai número da reserva principal
// ============================================================
function extrairNumeroReservaPrincipal(reservationNumber) {
  if (!reservationNumber) return null;

  // Formato esperado: "MR 0016140169-0001" ou "MR 0016140169"
  // Remove "MR " do início
  let semMr = reservationNumber.replace(/^MR\s+/, "");

  // Remove o sufixo -XXXX (sequencial do item)
  const numeroPrincipal = semMr.split("-")[0];

  // Extrai o sequencial do item se existir
  const sequencialItem = semMr.includes("-") ? semMr.split("-")[1] : null;

  return {
    numeroReserva: numeroPrincipal, // "0016140169"
    numeroCompleto: reservationNumber, // "MR 0016140169-0001"
    sequencialItem: sequencialItem, // "0001" ou null
    hasDash: reservationNumber.includes("-"),
  };
}

// ============================================================
// CRIA RESERVA COMPLETA (AGUARDA INTEGRAÇÃO)
// ============================================================
export async function createReserva({
  codigoMaquina,
  materiais,
  descricaoOS,
  descricaoAtividade,
  aguardarSAP = true,
  maxAttempts = 8,
  intervalSeconds = 3,
}) {
  const startTime = Date.now();
  const transactionId = randomUUID();

  console.log(
    `[${transactionId}] 🚀 Iniciando criação de reserva para máquina: ${codigoMaquina}`,
  );
  console.log(`[${transactionId}] 📦 Materiais: ${JSON.stringify(materiais)}`);

  try {
    // Validações
    if (!codigoMaquina) {
      return {
        success: false,
        message: "Código da máquina é obrigatório",
        transactionId,
      };
    }

    if (!materiais || !Array.isArray(materiais) || materiais.length === 0) {
      return {
        success: false,
        message: "Lista de materiais é obrigatória",
        transactionId,
      };
    }

    // ============================================================
    // PASSO 1: Busca materiais em paralelo com criação da ordem
    // ============================================================
    console.log(`[${transactionId}] ⚡ Executando operações em paralelo...`);

    const [materiaisEncontrados, resultadoOrdemAtividade] = await Promise.all([
      buscarMultiplosMateriais(materiais.map((m) => m.codigo)),
      criarOrdemEAtividadeParalelo(
        codigoMaquina,
        descricaoOS,
        descricaoAtividade,
      ),
    ]);

    if (!materiaisEncontrados.success) {
      return {
        success: false,
        message: materiaisEncontrados.message,
        transactionId,
      };
    }

    if (!resultadoOrdemAtividade.success) {
      return {
        success: false,
        message: resultadoOrdemAtividade.message,
        transactionId,
      };
    }

    // Mapeia materiais encontrados
    const materiaisMap = new Map();
    for (const material of materiaisEncontrados.materials) {
      materiaisMap.set(material.code, material);
    }

    // Verifica materiais não encontrados
    const naoEncontrados = materiais.filter((m) => !materiaisMap.has(m.codigo));
    const encontrados = materiais.filter((m) => materiaisMap.has(m.codigo));

    if (naoEncontrados.length > 0) {
      console.log(
        `[${transactionId}] ⚠️ Materiais não encontrados: ${naoEncontrados.map((m) => m.codigo).join(", ")}`,
      );
    }

    console.log(
      `[${transactionId}] ✅ Materiais encontrados: ${encontrados.length}/${materiais.length}`,
    );
    console.log(
      `[${transactionId}] ✅ Ordem criada: ${resultadoOrdemAtividade.orderNumber}`,
    );

    // ============================================================
    // PASSO 2: Criar reservas sequencialmente
    // ============================================================
    console.log(`[${transactionId}] 📦 Criando reservas...`);

    const reservas = [];
    for (const material of encontrados) {
      const materialInfo = materiaisMap.get(material.codigo);
      const quantidade = material.quantidade || 1;

      console.log(`[${transactionId}]   ${material.codigo} x${quantidade}...`);

      const resultadoReserva = await criarReservaMaterial({
        maintOrderId: resultadoOrdemAtividade.orderId,
        materialId: materialInfo.id,
        quantity: quantidade,
        maintOrderActivityId: resultadoOrdemAtividade.activityId,
      });

      if (resultadoReserva.success) {
        console.log(
          `[${transactionId}]   ✅ ${resultadoReserva.reservationNumber}`,
        );

        // Extrai informações da reserva inicial (sem DASH ainda)
        const reservaInfo = extrairNumeroReservaPrincipal(
          resultadoReserva.reservationNumber,
        );

        reservas.push({
          codigo: material.codigo,
          materialId: materialInfo.id,
          quantidade,
          reservationId: resultadoReserva.reservationId,
          reservationNumber: resultadoReserva.reservationNumber,
          numeroReserva: reservaInfo?.numeroReserva || null, // Será preenchido após integração
          integrated: false,
        });
      } else {
        console.log(
          `[${transactionId}]   ❌ Falha: ${resultadoReserva.message}`,
        );
      }
    }

    if (reservas.length === 0) {
      return {
        success: false,
        message: "Nenhuma reserva foi criada",
        transactionId,
      };
    }

    // ============================================================
    // PASSO 3: Aguardar integração SAP (se solicitado)
    // ============================================================
    let integracaoResultado = null;
    let numeroReservaPrincipal = null;

    if (aguardarSAP && reservas.length > 0) {
      console.log(`[${transactionId}] 🔗 Aguardando integração SAP...`);

      // AGUARDA a integração terminar
      integracaoResultado = await aguardarIntegracaoSAP({
        transactionId,
        orderId: resultadoOrdemAtividade.orderId,
        reservas,
        maxAttempts,
        intervalSeconds,
      });

      // Extrai o número da reserva principal do primeiro material integrado
      if (integracaoResultado?.reservas?.length > 0) {
        const primeiraReservaIntegrada = integracaoResultado.reservas.find(
          (r) => r.integrated && r.finalNumber,
        );
        if (primeiraReservaIntegrada) {
          const reservaInfo = extrairNumeroReservaPrincipal(
            primeiraReservaIntegrada.finalNumber,
          );
          numeroReservaPrincipal = reservaInfo?.numeroReserva;
        }
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;

    // Prepara reservas com status final
    const reservasFinal = reservas.map((r) => {
      const finalNumber = r.finalNumber || r.reservationNumber;
      const reservaInfo = extrairNumeroReservaPrincipal(finalNumber);

      return {
        codigo: r.codigo,
        quantidade: r.quantidade,
        reservationNumber: finalNumber,
        numeroReserva: reservaInfo?.numeroReserva || r.numeroReserva,
        sequencialItem: reservaInfo?.sequencialItem,
        integrated: r.integrated || false,
        integratedAt: r.integratedAt || null,
      };
    });

    // ✅ RETORNO SEM O CAMPO 'success' (apenas dados)
    return {
      transactionId,
      orderNumber: resultadoOrdemAtividade.orderNumber,
      orderId: resultadoOrdemAtividade.orderId,
      numeroReservaPrincipal, // NÚMERO DA RESERVA PRINCIPAL (ex: "0016140169")
      reservas: reservasFinal,
      ...(integracaoResultado && { integracao: integracaoResultado }),
      totalTime: `${totalTime}s`,
      message: aguardarSAP
        ? integracaoResultado?.status === "completed"
          ? `Reservas criadas e integradas com SAP. Reserva: ${numeroReservaPrincipal || "N/A"}`
          : "Timeout na integração SAP - verifique o status"
        : "Reservas criadas com sucesso",
    };
  } catch (error) {
    console.error(`[${transactionId}] ❌ Erro ao criar reserva:`, error);
    return {
      success: false,
      message: error.message || "Erro interno ao criar reserva",
      transactionId,
    };
  }
}

// ============================================================
// FUNÇÃO QUE AGUARDA A INTEGRAÇÃO SAP
// ============================================================
async function aguardarIntegracaoSAP({
  transactionId,
  orderId,
  reservas,
  maxAttempts,
  intervalSeconds,
}) {
  return new Promise(async (resolve) => {
    let attempts = 0;
    const reservasParaMonitorar = reservas.map((r) => ({
      ...r,
      integrated: false,
    }));
    let resolved = false;

    const interval = setInterval(async () => {
      if (resolved) return;

      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(interval);
        monitoringJobs.delete(transactionId);
        resolved = true;

        // Salva status no Redis
        try {
          await redisService.setJson(
            `reserva:status:${transactionId}`,
            {
              status: "timeout",
              message: "Tempo limite excedido aguardando integração SAP",
              attempts,
              reservas: reservasParaMonitorar,
            },
            { ttl: 3600 },
          );
        } catch (err) {
          console.error(
            `[${transactionId}] Erro ao salvar status no Redis:`,
            err,
          );
        }

        console.log(
          `[${transactionId}] ⏰ Timeout após ${maxAttempts} tentativas`,
        );

        resolve({
          status: "timeout",
          message: "Tempo limite excedido aguardando integração SAP",
          attempts,
          reservas: reservasParaMonitorar,
        });
        return;
      }

      console.log(
        `[${transactionId}] 🔍 Verificando integração SAP (tentativa ${attempts}/${maxAttempts})...`,
      );

      // Verifica cada reserva
      for (const reserva of reservasParaMonitorar) {
        if (!reserva.integrated) {
          try {
            const resultado = await consultarReservaPorId(
              reserva.reservationId,
              orderId,
            );

            if (resultado.success && resultado.hasDash) {
              reserva.integrated = true;
              reserva.finalNumber = resultado.reservationNumber;
              reserva.integratedAt = new Date().toISOString();

              // Extrai informações da reserva integrada
              const reservaInfo = extrairNumeroReservaPrincipal(
                resultado.reservationNumber,
              );
              reserva.numeroReserva = reservaInfo?.numeroReserva;
              reserva.sequencialItem = reservaInfo?.sequencialItem;

              console.log(
                `[${transactionId}] ✅ ${reserva.codigo} integrado: ${resultado.reservationNumber} (Reserva: ${reservaInfo?.numeroReserva})`,
              );
            }
          } catch (err) {
            console.error(
              `[${transactionId}] Erro ao consultar reserva ${reserva.codigo}:`,
              err,
            );
          }
        }
      }

      // Verifica se todas foram integradas
      const allIntegrated = reservasParaMonitorar.every((r) => r.integrated);

      if (allIntegrated) {
        clearInterval(interval);
        monitoringJobs.delete(transactionId);
        resolved = true;

        // Descobre o número da reserva principal (deve ser o mesmo para todos)
        const reservaComNumero = reservasParaMonitorar.find(
          (r) => r.numeroReserva,
        );
        const numeroReservaPrincipal = reservaComNumero?.numeroReserva || null;

        // Salva status no Redis
        try {
          await redisService.setJson(
            `reserva:status:${transactionId}`,
            {
              status: "completed",
              message: "Todas as reservas foram integradas com o SAP",
              numeroReservaPrincipal,
              attempts,
              reservas: reservasParaMonitorar,
            },
            { ttl: 3600 },
          );
        } catch (err) {
          console.error(
            `[${transactionId}] Erro ao salvar status no Redis:`,
            err,
          );
        }

        console.log(
          `[${transactionId}] 🎉 Todas as reservas integradas com sucesso! Reserva: ${numeroReservaPrincipal}`,
        );

        resolve({
          status: "completed",
          message: "Todas as reservas foram integradas com o SAP",
          numeroReservaPrincipal,
          attempts,
          reservas: reservasParaMonitorar,
        });
      }
    }, intervalSeconds * 1000);
  });
}

// ============================================================
// CONSULTA STATUS DA RESERVA
// ============================================================
export async function getReservaStatus(req, res) {
  try {
    const { id } = req.params;
    const { orderId } = req.query;

    const statusKey = `reserva:status:${id}`;
    const cachedStatus = await redisService.get(statusKey);

    if (cachedStatus) {
      const parsed = JSON.parse(cachedStatus);
      return res.json({
        success: true,
        ...parsed,
      });
    }

    if (orderId) {
      const resultado = await consultarReservaPorId(id, parseInt(orderId));
      const reservaInfo = extrairNumeroReservaPrincipal(
        resultado.reservationNumber,
      );

      return res.json({
        success: resultado.success,
        reservationNumber: resultado.reservationNumber,
        numeroReserva: reservaInfo?.numeroReserva,
        sequencialItem: reservaInfo?.sequencialItem,
        isIntegrated: resultado.isIntegrated,
        hasDash: resultado.hasDash,
      });
    }

    return res.status(404).json({
      success: false,
      message: "Status não encontrado",
    });
  } catch (error) {
    console.error("❌ Erro ao consultar status:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

async function buscarMultiplosMateriais(codigos) {
  try {
    const result = await getMaterialByCode(codigos, 1, codigos.length);

    if (result && result.data && result.data.length > 0) {
      return {
        success: true,
        total: result.data.length,
        materials: result.data,
      };
    }

    return {
      success: false,
      message: "Nenhum material encontrado",
      materials: [],
    };
  } catch (error) {
    console.error("Erro ao buscar materiais:", error);
    return {
      success: false,
      message: error.message,
      materials: [],
    };
  }
}

async function criarOrdemEAtividadeParalelo(
  codigoMaquina,
  descricaoOS,
  descricaoAtividade,
) {
  try {
    const assetResult = await buscarAssetPorCodigo(codigoMaquina);
    if (!assetResult.success) {
      return { success: false, message: assetResult.message };
    }

    const ordemResult = await criarOrdemManutencao({
      assetId: assetResult.asset.id,
      description: descricaoOS || `Manutenção - ${codigoMaquina}`,
      companyId: assetResult.asset.company_id,
      areaId: assetResult.asset.area_id,
      locations: assetResult.locations,
    });

    if (!ordemResult.success) {
      return { success: false, message: ordemResult.message };
    }

    const atividadeResult = await criarAtividadeOrdem({
      maintOrderId: ordemResult.orderId,
      task: descricaoAtividade || "Manutenção programada",
    });

    if (!atividadeResult.success) {
      return { success: false, message: atividadeResult.message };
    }

    return {
      success: true,
      orderId: ordemResult.orderId,
      orderNumber: ordemResult.orderNumber,
      activityId: atividadeResult.activityId,
    };
  } catch (error) {
    console.error("Erro ao criar ordem/atividade:", error);
    return { success: false, message: error.message };
  }
}

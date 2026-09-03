import { useEffect, useState } from "react";
import {
  getCapJustificativaById,
  getCapListarMaquinas,
} from "../../../../api/cap.http";
import { useCapAction } from "./useCapAction";

const INITIAL_EDITABLE = {
  causaRaiz: "",
  maquina: "",
  descricao: "",
  comentario: "",
  componente: "",
};

export function useCapValidacao(id, onUpdated) {
  const {
    approve,
    requestChanges,
    loading: actionLoading,
    error,
  } = useCapAction();

  const [justificativa, setJustificativa] = useState(null);
  const [maquinasOptions, setMaquinasOptions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [validated, setValidated] = useState(null);
  const [editableData, setEditableData] = useState(INITIAL_EDITABLE);
  const [originalData, setOriginalData] = useState(INITIAL_EDITABLE);

  // ─────────────────────────────────────────────
  // FETCH PRINCIPAL
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    fetchJustificativa();
  }, [id]);

  async function fetchJustificativa() {
    try {
      setPageLoading(true);

      // 1. Desestruturamos a resposta para pegar apenas o que está em 'data'
      // Assumindo que getCapJustificativaById retorna o objeto completo da API
      const response = await getCapJustificativaById(id);
      const data = response?.data; // Acessa a propriedade data do JSON que você enviou

      if (!data) return;

      const latestHistory = data.historico?.[0] ?? {};

      setJustificativa(data);

      const baseData = {
        causaRaiz: latestHistory.causaRaiz ?? "",
        maquina: data.maquina ?? "",
        // Note que no seu JSON da API o campo é 'modoFalha',
        // mas no seu objeto local você usa 'descricao'. Mantive 'descricao' conforme seu código original.
        descricao: latestHistory.descricao ?? "",
        componente: latestHistory.componente ?? "",
        comentario: "",
      };

      setEditableData(baseData);
      setOriginalData(baseData);

      await fetchMaquinas(data.linha);
    } catch (err) {
      console.error("Error fetching justification:", err);
    } finally {
      setPageLoading(false);
    }
  }

  async function fetchMaquinas(linha) {
    try {
      const response = await getCapListarMaquinas({ linha });

      // Acessamos o .data da resposta.
      // Se vier nulo ou indefinido, garantimos um array vazio []
      const machines = response?.data ?? [];

      setMaquinasOptions(machines);
    } catch (err) {
      console.error("Error fetching machines:", err);
      setMaquinasOptions([]);
    }
  }
  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────
  function handleChange(field, value) {
    setEditableData((prev) => ({ ...prev, [field]: value }));
  }

  function buildPayload() {
    const payload = {
      comentario: editableData.comentario,
    };

    if (editableData.causaRaiz !== originalData.causaRaiz) {
      payload.causa_raiz = editableData.causaRaiz;
    }

    if (editableData.maquina !== originalData.maquina) {
      payload.maquina = editableData.maquina;
    }

    if (editableData.componente !== originalData.componente) {
      payload.componente = editableData.componente;
    }

    if (editableData.descricao !== originalData.descricao) {
      payload.modo_falha = editableData.descricao;
    }

    return payload;
  }

  async function handleSubmit() {
    try {
      let result;

      if (validated === true) {
        result = await approve(justificativa.id);
      } else {
        const payload = buildPayload();
        result = await requestChanges(justificativa.id, payload);
        setValidated(true); // resetar validação para forçar revalidação após solicitar alterações
      }

      if (result?.error) return;

      setPageLoading(true);
      await fetchJustificativa();
      setPageLoading(false);

      // opcional (se quiser avisar pai)
      onUpdated?.();
    } catch (err) {
      console.error("Erro ao processar justificativa:", err);
    }
  }

  function isFormValid() {
    if (validated === null) return false;
    if (validated === true) return true;

    return editableData.comentario.trim() !== "";
  }

  // ─────────────────────────────────────────────
  // RETURN PADRONIZADO
  // ─────────────────────────────────────────────
  return {
    justificativa,
    maquinasOptions,

    // loading
    pageLoading,
    actionLoading,

    // form state
    validated,
    setValidated,
    editableData,

    // handlers
    handleChange,
    handleSubmit,

    // computed
    isFormValid: isFormValid(),

    // errors
    error,
  };
}

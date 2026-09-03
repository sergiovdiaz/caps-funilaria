export const buildPayload = ({
  justificativa,
  editableData,
  user,
  latestHistory,
}) => {
  return {
    matricula: user.matricula,
    responsavel: latestHistory.responsavel || "MANUTENÇÃO",
    descricao: editableData.descricao,
    causaRaiz: editableData.causaRaiz,
    componente: editableData.componente,
    comentario: editableData.comentario,
    maquina: editableData.maquina,
    linha: justificativa.linha,
    data: justificativa.data,
    hora: justificativa.hora,
  };
};

// components/JustificativaInfoBox.jsx
import StatusBadge from "../../common/StatusBadge";
import { formatMinutesToHHMMSS } from "../../utils/capUtils";

export function JustificativaInfoBox({ justificativa, latestHistory }) {
  // Verifica se existe interventor
  const hasInterventor = justificativa.interventor;
  console.log("Justificativa recebida:", justificativa);

  return (
    <div className="validation-info-box">
      <InfoRow label="Linha" value={justificativa.linha} />
      <InfoRow
        label="Data"
        value={new Date(justificativa.data).toLocaleDateString("pt-BR")}
      />
      <InfoRow label="Hora" value={justificativa.hora} />
      <InfoRow
        label="Duração"
        value={formatMinutesToHHMMSS(justificativa.duracao)}
      />

      <InfoRow label="Responsável" value={justificativa.responsavel} />
      <InfoRow
        label="Status"
        value={
          <StatusBadge
            textstatus={justificativa.status?.nome}
            status={justificativa.status?.texto}
          />
        }
      />
      <InfoRow label="Validador" value={justificativa.validador} />

      {/* Mostra interventor antes do criador se existir */}
      {hasInterventor && (
        <InfoRow label="Interventor" value={justificativa.interventor} />
      )}
      <InfoRow label="Criador" value={latestHistory.criador?.nome ?? "-"} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <p>
      <strong>{label}:</strong> {value ?? "-"}
    </p>
  );
}

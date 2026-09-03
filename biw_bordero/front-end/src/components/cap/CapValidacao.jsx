import "./styles/CapJustificativaValidacao.css";
import { useCapValidacao } from "./hooks/useCapValidacao";
import { JustificativaInfoBox } from "./components/CapJustificativa/JustificativaInfoBox";
import LoadingState from "./components/CapJustificativa/LoadingState";
import JustificativaForm from "./components/CapJustificativa/JustificativaForm";
import { JustificativaHistoricoTable } from "./components/CapJustificativa/JustificativaHistoricoTable";
import ArvoreRelacao from "./components/CapJustificativa/RelacaoTree";

const CapValidacao = ({ id, onUpdated }) => {
  const state = useCapValidacao(id, onUpdated);

  if (state.pageLoading) return <LoadingState />;
  // if (!state.justificativa) return <ErrorState />;

  const latestHistory = state.justificativa.historico?.[0] ?? {};
  const isFinalized = state.justificativa.status?.id == 2;

  return (
    <div className="validation-container">
      <h2 className="validation-title">Validação da Justificativa</h2>

      <JustificativaInfoBox
        justificativa={state.justificativa}
        latestHistory={latestHistory}
      />

      <div className="validation-content">
        <div className="validation-content-left">
          <JustificativaForm
            justificativa={state.justificativa}
            maquinasOptions={state.maquinasOptions}
            validated={state.validated}
            setValidated={state.setValidated}
            editableData={state.editableData}
            handleChange={state.handleChange}
            handleSubmit={state.handleSubmit}
            isFormValid={state.isFormValid}
            loading={state.actionLoading}
            error={state.error}
            isFinalized={isFinalized}
          />
        </div>
        <div className="validation-content-right">
          <ArvoreRelacao justificativa={state.justificativa} />
        </div>
      </div>
      <JustificativaHistoricoTable
        historico={state.justificativa.historico ?? []}
      />
    </div>
  );
};

export default CapValidacao;

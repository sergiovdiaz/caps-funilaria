// components/JustificativaForm.jsx
import { CAUSAS, MODO_FALHA, COMPONENTE } from "../../utils/capConstant";
import { FilterComboBox } from "../../common/FilterComboBox";
import { buildValidationErrors } from "../../utils/capValidation";
import Button from "../../../common/Button";

const JustificativaForm = ({
  editableData,
  maquinasOptions,
  validated,
  setValidated,
  isFinalized,
  isFormValid,
  handleChange,
  handleSubmit,
  loading,
  error,
}) => {
  const isAlteration = validated === false && !isFinalized;
  const errors = isAlteration
    ? buildValidationErrors(editableData, maquinasOptions)
    : {};

  return (
    <div className="validation-current">
      <h3 className="validation-section-title">Versão Atual</h3>
      <div className="validation-form">
        <FormField label="Causa Raiz">
          {isAlteration ? (
            <FilterComboBox
              value={editableData.causaRaiz}
              onChange={(value) => handleChange("causaRaiz", value)}
              options={CAUSAS}
              hasError={errors.causaRaiz}
              placeholder="Selecione a causa raiz..."
            />
          ) : (
            <span className="validation-text">
              {editableData.causaRaiz || "-"}
            </span>
          )}
        </FormField>

        <FormField label="Máquina">
          {isAlteration ? (
            <FilterComboBox
              value={editableData.maquina}
              onChange={(value) => handleChange("maquina", value)}
              options={maquinasOptions.map((m) => m.maquina)}
              hasError={errors.maquina}
              placeholder="Digite para filtrar máquinas..."
            />
          ) : (
            <span className="validation-text">
              {editableData.maquina || "-"}
            </span>
          )}
        </FormField>

        <FormField label="Componente">
          {isAlteration ? (
            <FilterComboBox
              value={editableData.componente}
              onChange={(value) => handleChange("componente", value)}
              options={COMPONENTE}
              hasError={errors.componente}
              placeholder="Digite para filtrar componentes..."
            />
          ) : (
            <span className="validation-text">
              {editableData.componente || "-"}
            </span>
          )}
        </FormField>

        <FormField label="Modo de Falha">
          {isAlteration ? (
            <FilterComboBox
              value={editableData.descricao}
              onChange={(value) => handleChange("descricao", value)}
              options={MODO_FALHA}
              hasError={errors.descricao}
              placeholder="Selecione o modo de falha..."
            />
          ) : (
            <span className="validation-text">
              {editableData.descricao || "-"}
            </span>
          )}
        </FormField>

        {isAlteration && (
          <FormField label="Comentário da Alteração" required>
            <textarea
              className={`validation-textarea ${errors.comentario ? "input-error" : ""}`}
              value={editableData.comentario}
              placeholder="Descreva o motivo da alteração..."
              onChange={(e) => handleChange("comentario", e.target.value)}
              rows={3}
            />
          </FormField>
        )}

        {isFinalized && <FinalizedMessage />}

        {!isFinalized && (
          <ValidationActions
            validated={validated}
            setValidated={setValidated}
            isFormValid={isFormValid}
            handleSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

// ─── sub-componentes locais ────────────────────────────────────────────────────

const FormField = ({ label, required, children }) => (
  <div className="validation-form-group">
    <label className="validation-label">
      {label} {required && <span className="required-field">*</span>}
    </label>
    {children}
  </div>
);

const FinalizedMessage = () => (
  <div className="finalized-message">
    Esta justificativa já foi validada e não pode ser alterada.
  </div>
);

const ValidationActions = ({
  validated,
  setValidated,
  isFormValid,
  handleSubmit,
  loading,
  error,
}) => (
  <>
    <div className="validation-radio-group">
      <label className="radio-label">
        <input
          type="radio"
          name="validation"
          checked={validated === true}
          onChange={() => setValidated(true)}
        />
        <span>Aprovar Justificativa</span>
      </label>

      <label className="radio-label">
        <input
          type="radio"
          name="validation"
          checked={validated === false}
          onChange={() => setValidated(false)}
        />
        <span>Propor Alteração</span>
      </label>
    </div>

    {validated !== null && (
      <>
        {error && <div className="validation-error-message">{error}</div>}

        <div className="validation-actions">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isFormValid}
            loading={loading}
          >
            Confirmar {validated ? "Aprovação" : "Alteração"}
          </Button>
        </div>
      </>
    )}
  </>
);

export default JustificativaForm;

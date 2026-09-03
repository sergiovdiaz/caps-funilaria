import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePCMUpload } from "../components/pcm/hooks/usePCMUpload";
import PCMProgramacaoGantt from "../components/pcm/PCMProgramacaoGantt";
import "../components/pcm/styles/PCMProgramacao.css";
import PCMModal from "../components/pcm/PCMModal";

/* ─── Page ───────────────────────────────────────────────────── */

const PCMProgramacao = ({ onRequestLogin }) => {
  const { isAuthenticated } = useAuth();
  const { loading, error, success, sendFile, abort } = usePCMUpload();

  const [file, setFile] = useState(null);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [semana, setSemana] = useState("");
  const [pendingUpload, setPendingUpload] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /* ───────────────────────────── */
  /* Modal Service */
  /* ───────────────────────────── */

  const confirm = useCallback(
    (config) => {
      return new Promise((resolve) => {
        setModal({
          config,
          resolve: (value) => {
            if (value === false) {
              abort(); // 🔥 CANCELA O UPLOAD AQUI
            }
            resolve(value);
          },
        });
      });
    },
    [abort],
  );
  const closeModal = () => setModal(null);

  /* ───────────────────────────── */
  /* Upload Orchestrator */
  /* ───────────────────────────── */

  const processUpload = async ({
    file,
    ano,
    semana,
    forceOverwrite = false,
  }) => {
    const result = await sendFile(file, ano, semana, forceOverwrite);

    /* Semana divergente */
    if (result?.type === "week_mismatch") {
      const { requested, actual } = result;

      const useFileWeek = await confirm({
        title: "Semana divergente",
        icon: "📅",
        iconType: "warning",
        subtitle: `Semana ${requested.semana} · ${requested.ano}`,
        description: `A programação do arquivo enviado inicia em ${new Date(
          actual.dataInicio,
        ).toLocaleDateString()} (Semana ${actual.semana}/${actual.ano}). 
        Você informou Semana ${requested.semana}/${requested.ano}. 
        Deseja ajustar?`,
        infoRows: [
          {
            label: "Semana no arquivo",
            value: `${actual.semana} / ${actual.ano}`,
          },
          {
            label: "Semana informada",
            value: `${requested.semana} / ${requested.ano}`,
          },
        ],
        confirmLabel: "Usar semana do arquivo",
        cancelLabel: "Manter semana informada",
        confirmVariant: "primary",
      });

      closeModal();
      if (!useFileWeek) return;

      const finalAno = useFileWeek ? actual.ano : requested.ano;
      const finalSemana = useFileWeek ? actual.semana : requested.semana;

      if (useFileWeek) {
        setAno(finalAno);
        setSemana(finalSemana);
      }

      return processUpload({
        file,
        ano: finalAno,
        semana: finalSemana,
        forceOverwrite,
      });
    }

    /* Conflito */
    if (result?.conflict) {
      const { nome, uploadedAt } = result.existing;

      const overwrite = await confirm({
        title: "Dados já existentes",
        icon: "⚠️",
        iconType: "warning",
        subtitle: `Semana ${semana} · ${ano}`,
        description:
          "Já existe uma programação cadastrada para este período. Deseja substituir?",
        infoRows: [
          { label: "Enviado por", value: nome },
          {
            label: "Data do envio",
            value: new Date(uploadedAt).toLocaleString("pt-BR"),
          },
        ],
        confirmLabel: "Substituir dados",
        cancelLabel: "Cancelar",
        confirmVariant: "danger",
      });

      closeModal();

      if (!overwrite) return;

      return processUpload({
        file,
        ano,
        semana,
        forceOverwrite: true,
      });
    }

    return result;
  };

  /* ───────────────────────────── */
  /* Submit */
  /* ───────────────────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !ano || !semana) {
      await confirm({
        title: "Campos obrigatórios",
        icon: "ℹ️",
        iconType: "info",
        description:
          "Preencha o ano, a semana e selecione um arquivo antes de enviar.",
        confirmLabel: "Entendido",
        confirmVariant: "primary",
      });
      closeModal();
      return;
    }

    if (!isAuthenticated) {
      setPendingUpload(true);
      onRequestLogin?.();
      return;
    }

    await processUpload({ file, ano, semana });
  };

  useEffect(() => {
    if (isAuthenticated && pendingUpload) {
      processUpload({ file, ano, semana });
      setPendingUpload(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (success) {
      setShowSuccess(true);

      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 10000); // 10 segundos

      return () => clearTimeout(timer);
    }
  }, [success]);

  
  /* ───────────────────────────── */
  /* UI  */
  /* ───────────────────────────── */

  return (
    <div className="pcm-programacao">
      <PCMModal modal={modal} />

      <div
        className={`pcm-upload-card ${
          uploadOpen ? "pcm-upload-card--open" : ""
        }`}
      >
        <div
          className="pcm-upload-card__header pcm-upload-card__header--toggle"
          onClick={() => setUploadOpen((v) => !v)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 className="pcm-upload-card__title">Importar Programação</h2>
          </div>

          <div className="pcm-upload-card__toggle-info">
            {!uploadOpen && (
              <span className="pcm-upload-card__hint">
                Clique para expandir
              </span>
            )}
            <span
              className={`pcm-upload-card__chevron ${
                uploadOpen ? "pcm-upload-card__chevron--up" : ""
              }`}
            >
              ‹
            </span>
          </div>
        </div>

        <div className="pcm-upload-card__body">
          <form className="pcm-upload-form" onSubmit={handleSubmit}>
            <div className="pcm-upload-form__field">
              <label className="pcm-upload-form__label">Ano</label>
              <input
                className="pcm-upload-form__input"
                type="number"
                min={2025}
                max={2100}
                value={ano}
                onChange={(e) => setAno(e.target.value)}
              
              />
            </div>

            <div className="pcm-upload-form__field">
              <label className="pcm-upload-form__label">Semana</label>
              <input
                className="pcm-upload-form__input"
                type="number"
                min={1}
                max={53}
                value={semana}
                onChange={(e) => setSemana(e.target.value)}
              />
            </div>

            <div className="pcm-upload-form__field">
              <label className="pcm-upload-form__label">
                Arquivo (.xlsx / .xls)
              </label>
              <input
                className="pcm-upload-form__input pcm-upload-form__input--file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            <div
              className="pcm-upload-form__field"
              style={{
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <button
                className="pcm-btn pcm-btn--primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Enviando…" : "↑ Enviar"}
              </button>
            </div>
          </form>

          {error && (
            <div className="pcm-feedback pcm-feedback--error">⚠ {error}</div>
          )}
          {showSuccess && (
            <div className="pcm-feedback pcm-feedback--success">
              ✓ Upload realizado com sucesso!
            </div>
          )}
        </div>
      </div>

      <hr className="pcm-divider" />

      <div className="pcm-gantt-section">
        <PCMProgramacaoGantt />
      </div>
    </div>
  );
};

export default PCMProgramacao;

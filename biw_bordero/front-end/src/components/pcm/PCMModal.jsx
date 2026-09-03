const PCMModal = ({ modal }) => {
  if (!modal) return null;

  const { config, resolve } = modal;

  const handleConfirm = () => {
    resolve(true);
  };

  const handleCancel = () => {
    resolve(false);
  };

  return (
    <div className="pcm-modal-overlay" onClick={handleCancel}>
      <div
        className="pcm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pcmModalTitulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pcm-modal__header">
          <div
            className={`pcm-modal__icon pcm-modal__icon--${config.iconType ?? "warning"}`}
          >
            {config.icon ?? "⚠️"}
          </div>

          <div className="pcm-modal__titles">
            <h2 className="pcm-modal__title" id="pcmModalTitulo">
              {config.title}
            </h2>
            {config.subtitle && (
              <p className="pcm-modal__subtitle">{config.subtitle}</p>
            )}
          </div>

          <button
            className="pcm-modal__close"
            onClick={handleCancel}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="pcm-modal__body">
          <p className="pcm-modal__description">{config.description}</p>

          {config.infoRows?.length > 0 && (
            <div className="pcm-modal__info-box">
              {config.infoRows.map((row) => (
                <div key={row.label} className="pcm-modal__info-row">
                  <span className="pcm-modal__info-label">{row.label}</span>
                  <span className="pcm-modal__info-value">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pcm-modal__footer">
          {config.cancelLabel && (
            <button
              className="pcm-btn pcm-btn--secondary"
              onClick={handleCancel}
            >
              {config.cancelLabel}
            </button>
          )}
          <button
            className={`pcm-btn pcm-btn--${config.confirmVariant ?? "danger"}`}
            onClick={handleConfirm}
          >
            {config.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PCMModal;

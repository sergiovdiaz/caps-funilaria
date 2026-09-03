export default function BufferCard({ buffers = {}, line }) {
  const entradas = Object.entries(buffers.in || {});
  const saidas = Object.entries(buffers.out || {});

  return (
    <div className="cardandon card--buffer">
      <span className="section__title">ACÚMULOS</span>

      <div className="buffer__content">
        {/* 🔹 ENTRADA */}
        <div className="buffer__section">
          <div className="buffer__header">
            <span className="buffer__label">Precedente</span>
          </div>

          {entradas.length > 0 ? (
            entradas.map(([origem, valor], index) => (
              <div
                key={`entrada-${origem}-${index}`}
                className="buffer__row buffer__row--entrada"
              >
                <span className="buffer__acumulo-label">
                  {origem} → {line}
                </span>
                <span className="buffer__acumulo-number">{valor}</span>
              </div>
            ))
          ) : (
            <div className="buffer__row buffer__row--empty">
              <span className="buffer__empty-text">
                Nenhum acúmulo de precedente
              </span>
            </div>
          )}
        </div>

        {/* 🔹 SAÍDA */}
        <div className="buffer__section">
          <div className="buffer__header">
            <span className="buffer__label">Sucessivo</span>
          </div>

          {saidas.length > 0 ? (
            saidas.map(([destino, valor], index) => (
              <div
                key={`saida-${destino}-${index}`}
                className="buffer__row buffer__row--saida"
              >
                <span className="buffer__acumulo-label">
                  {line} → {destino}
                </span>
                <span className="buffer__acumulo-number">{valor}</span>
              </div>
            ))
          ) : (
            <div className="buffer__row buffer__row--empty">
              <span className="buffer__empty-text">
                Nenhum acúmulo sucessivo
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

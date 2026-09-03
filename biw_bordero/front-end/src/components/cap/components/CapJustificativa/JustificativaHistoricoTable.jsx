// components/JustificativaHistoricoTable.jsx

const HistoricoRow = ({ item }) => (
  <tr>
    <td>
      {item.criadoEm ? new Date(item.criadoEm).toLocaleString("pt-BR") : "-"}
    </td>
    <td>{item.causaRaiz || "-"}</td>
    <td>{item.maquina || "-"}</td>
    <td>{item.componente || "-"}</td>
    <td>{item.descricao || "-"}</td>
    <td>{item.responsavel || "-"}</td>
    <td className="comment-cell">{item.comentario || "-"}</td>
    <td>{item.criador?.nome || "-"}</td>
  </tr>
);

export function JustificativaHistoricoTable({ historico }) {
  if (!historico.length) return null;

  return (
    <div className="validation-history">
      <h3 className="validation-section-title">
        Histórico de Alterações ({historico.length})
      </h3>
      <div className="table-responsive">
        <table className="validation-table">
          <thead>
            <tr>
              {[
                "Data/Hora",
                "Causa Raiz",
                "Máquina",
                "Componente",
                "Modo de Falha",
                "Responsável",
                "Comentário",
                "Criador",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...historico].reverse().map((item, index) => (
              <HistoricoRow key={item.id ?? index} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

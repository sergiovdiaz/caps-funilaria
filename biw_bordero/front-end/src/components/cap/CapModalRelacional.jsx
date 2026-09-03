import React, { useState, useEffect } from "react";
import "./styles/CapModalRelacional.css";
import StatusBadge from "./common/StatusBadge";
import { formatMinutesToHHMMSS } from "./utils/capUtils";

// ─── HELPERS ────────────────────────────────────────────────────────
const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ─── COMPONENTES ────────────────────────────────────────────────────
const LinhaTab = ({ linha, active, onClick }) => (
  <button
    className={`capmodalrel-tab ${active ? "active" : ""}`}
    onClick={() => onClick(linha)}
  >
    {linha}
  </button>
);

const JustificativaCard = ({ item, selected, onToggle, duracaoTarget }) => {
  const pctContrib = Math.round((item.tempo_disponivel / duracaoTarget) * 100); // Após o capmodalrel-card-header:
  return (
    <>
      <div
        className={`capmodalrel-card ${selected ? "selected" : ""}`}
        onClick={() => onToggle(item.id)}
      >
        <div className="capmodalrel-card-check">
          {selected && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path
                d="M1 4.5L4 7.5L10 1.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <div className="capmodalrel-card-header">
          <div>
            <div className="capmodalrel-card-title">
              <strong>{item.maquina}</strong>
              <StatusBadge
                textstatus={item.status?.nome}
                status={item.status?.texto}
              />
            </div>
            <span className="capmodalrel-card-id">
              ID #{item.id} · Matrícula {item.matricula}
            </span>
          </div>

          <div className="capmodalrel-highlight">
            <span>Tempo Disponível</span>
            <strong>{formatMinutesToHHMMSS(item.tempo_disponivel)}</strong>
          </div>
        </div>

        <div className="capmodalrel-card-contrib">
          <div className="capmodalrel-card-contrib-bar">
            <div style={{ width: `${Math.min(pctContrib, 100)}%` }} />
          </div>
          <span>{pctContrib}% da meta</span>
        </div>
        <div className="capmodalrel-card-grid">
          <div>
            <span>Data</span>
            <p>{formatDate(item.data)}</p>
          </div>
          <div>
            <span>Horário</span>
            <p>{item.hora}</p>
          </div>

          <div>
            <span>Duração</span>
            <p>{formatMinutesToHHMMSS(item.duracao)}</p>
          </div>

          <div>
            <span>Causa Raiz</span>
            <p>{item.causa_raiz}</p>
          </div>

          <div>
            <span>Componente</span>
            <p>{item.componente}</p>
          </div>

          <div>
            <span>Modo de Falha</span>
            <p>{item.modo_falha}</p>
          </div>

          {item.comentario && (
            <div>
              <span>Comentário</span>
              <p>{item.comentario}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── MODAL ──────────────────────────────────────────────────────────
const CapModalRelacional = ({
  open = true,
  onClose,
  onSave,
  data = [],
  linhas = [],
  horas = [],
  loading = false,
  duracaoTarget = 0,
  initialState = { ids: [], naoEncontrado: false, comentario: "" },
}) => {
  const [linhaAtiva, setLinhaAtiva] = useState("");

  useEffect(() => {
    if (open && linhas.length) {
      setLinhaAtiva(linhas[0]);
      setSelecionados({});
    }
  }, [open, linhas]);

  const [filtroHora, setFiltroHora] = useState("");
  const [selecionados, setSelecionados] = useState({});
  const [saving, setSaving] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [comentarioNaoEncontrado, setComentarioNaoEncontrado] = useState("");

  useEffect(() => {
    if (!open) return;

    setNaoEncontrado(initialState.naoEncontrado);
    setComentarioNaoEncontrado(initialState.comentario ?? "");

    // Reconstrói o mapa de selecionados a partir dos ids salvos
    if (initialState.ids.length > 0) {
      const mapa = Object.fromEntries(initialState.ids.map((id) => [id, true]));
      setSelecionados(mapa);
    } else {
      setSelecionados({});
    }
  }, [open]); // initialState intencionalmente fora — só restaura na abertura

  // Filtra os itens por linha e por horário selecionado
  const itens = data.filter((item) => {
    if (item.linha !== linhaAtiva) return false;
    if (!filtroHora) return true;
    return item.hora === filtroHora;
  });

  // Calcula o total de minutos selecionados
  const totalMin = Object.entries(selecionados)
    .filter(([, v]) => v)
    .map(([id]) => data.find((i) => i.id === id))
    .filter(Boolean)
    .reduce((acc, i) => acc + Number(i.tempo_disponivel || 0), 0);

  // Calcula o total de minutos selecionados com arredondamento para cima (2 casas)
  // const totalMin =
  //   Math.ceil(
  //     Object.entries(selecionados)
  //       .filter(([, v]) => v)
  //       .map(([id]) => data.find((i) => i.id === id))
  //       .filter(Boolean)
  //       .reduce((acc, i) => acc + Number(i.tempo_disponivel || 0), 0) * 100,
  //   ) / 100;

  const pct = Math.min((totalMin / duracaoTarget) * 100, 100);

  const isValid =
    Math.ceil((totalMin + Number.EPSILON) * 100) / 100 >= duracaoTarget;
  const totalSelecionados = Object.values(selecionados).filter(Boolean).length;

  const toggleItem = (id) => {
    setSelecionados((p) => ({ ...p, [id]: !p[id] }));
  };

  const selectAll = () => {
    const allSelected = itens.every((i) => selecionados[i.id]);
    const next = { ...selecionados };
    itens.forEach((i) => {
      next[i.id] = !allSelected;
    });
    setSelecionados(next);
  };

  const handleSave = async () => {
    setSaving(true);

    if (naoEncontrado) {
      onSave?.({
        ids: [],
        naoEncontrado: true,
        comentario: comentarioNaoEncontrado.trim(),
      });
    } else {
      const idsSelecionados = Object.entries(selecionados)
        .filter(([, v]) => v)
        .map(([id]) => Number(id));

      onSave?.({
        ids: idsSelecionados,
        naoEncontrado: false,
        comentario: null,
      });
    }

    setSaving(false);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="capmodalrel-overlay" onClick={onClose}>
      <div className="capmodalrel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="capmodalrel-container">
          {/* HEADER */}
          <div className="capmodalrel-header">
            <div className="capmodalrel-header-top">
              <div>
                <h2 className="capmodalrel-title">Selecionar Justificativas</h2>
                <p className="capmodalrel-subtitle">
                  Selecione a perda relacionada a FALTA ALIMENTAÇÃO ou FALTA
                  ABSORÇÃO que você deseja justificar.
                </p>
              </div>
              <button className="capmodalrel-close" onClick={onClose}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1L13 13M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="capmodalrel-progress-area">
              <div className="capmodalrel-progress-labels">
                <div>
                  <span className="capmodalrel-progress-small">
                    Tempo selecionado
                  </span>
                  <strong className="capmodalrel-progress-total">
                    {formatMinutesToHHMMSS(totalMin)}
                  </strong>
                  <span className={`capmodalrel-chip ${isValid ? "done" : ""}`}>
                    {isValid
                      ? "✓ meta atingida"
                      : `faltam ${formatMinutesToHHMMSS(duracaoTarget - totalMin)}`}
                  </span>
                </div>
                <div className="capmodalrel-progress-target">
                  Meta
                  <strong>{formatMinutesToHHMMSS(duracaoTarget)}</strong>
                </div>
              </div>

              <div className="capmodalrel-track">
                <div
                  className={`capmodalrel-fill ${isValid ? "complete" : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p
                className={`capmodalrel-progress-hint ${isValid ? "ok" : totalMin > 0 ? "error" : ""}`}
              >
                {isValid
                  ? "✓ Tempo suficiente selecionado, pode salvar!"
                  : totalMin > 0
                    ? `Ainda faltam ${formatMinutesToHHMMSS(duracaoTarget - totalMin)} para atingir a meta`
                    : "Selecione registros até atingir o tempo da perda"}
              </p>
            </div>

            {/* Filtro de horário */}
            <select
              className="capmodalrel-filter"
              value={filtroHora}
              onChange={(e) => setFiltroHora(e.target.value)}
            >
              <option value="">Todos horários</option>
              {horas.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            {/* Tabs das linhas */}
            <div className="capmodalrel-tabs">
              {linhas.map((l) => (
                <LinhaTab
                  key={l}
                  linha={l}
                  active={linhaAtiva === l}
                  onClick={setLinhaAtiva}
                />
              ))}
            </div>
          </div>

          {/* LIST HEADER */}
          <div className="capmodalrel-list-header">
            <span>
              {itens.length} registro{itens.length !== 1 ? "s" : ""} em{" "}
              <strong>{linhaAtiva}</strong>
            </span>
            <button className="capmodalrel-select-all" onClick={selectAll}>
              {itens.every((i) => selecionados[i.id])
                ? "Desmarcar todos"
                : "Selecionar todos"}
            </button>
          </div>

          {/* LISTA */}
          <div className="capmodalrel-list">
            {itens.length === 0 ? (
              <div className="capmodalrel-empty">
                Nenhum registro encontrado para esta linha.
              </div>
            ) : (
              itens.map((item) => (
                <JustificativaCard
                  key={item.id}
                  item={item}
                  duracaoTarget={duracaoTarget}
                  selected={!!selecionados[item.id]}
                  onToggle={toggleItem}
                />
              ))
            )}
          </div>

          {/* FOOTER */}
          <div className="capmodalrel-footer">
            {naoEncontrado && (
              <div className="capmodalrel-nao-encontrado-panel">
                <label className="capmodalrel-nao-encontrado-label">
                  Motivo <span>*obrigatório</span>
                </label>
                <textarea
                  className="capmodalrel-nao-encontrado-textarea"
                  placeholder="Descreva o motivo da sua perda, exemplo: 'Falta alimentação AUE'"
                  value={comentarioNaoEncontrado}
                  onChange={(e) => setComentarioNaoEncontrado(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            <div className="capmodalrel-footer-row">
              {totalSelecionados == 0 && (
                <div className="capmodalrel-footer-left">
                  <button
                    className={`capmodalrel-btn nao-encontrado ${naoEncontrado ? "active" : ""}`}
                    onClick={() => {
                      setNaoEncontrado((v) => !v);
                      setComentarioNaoEncontrado("");
                    }}
                  >
                    {naoEncontrado
                      ? "✕ Cancelar"
                      : "Não encontrei a justificativa relacionada"}
                  </button>
                </div>
              )}

              <span className="capmodalrel-footer-count">
                {totalSelecionados > 0 ? (
                  <>
                    <strong>
                      {totalSelecionados} item
                      {totalSelecionados !== 1 ? "s" : ""}
                    </strong>{" "}
                    selecionado{totalSelecionados !== 1 ? "s" : ""}
                  </>
                ) : (
                  "Nenhum item selecionado"
                )}
              </span>

              <div className="capmodalrel-footer-actions">
                <button className="capmodalrel-btn secondary" onClick={onClose}>
                  Cancelar
                </button>

                {naoEncontrado ? (
                  <button
                    className="capmodalrel-btn nao-encontrado-save"
                    disabled={comentarioNaoEncontrado.length < 3 || saving}
                    onClick={handleSave}
                  >
                    {saving ? (
                      <>
                        <span className="capmodalrel-spinner" /> Salvando...
                      </>
                    ) : (
                      "Salvar sem perda relacionada"
                    )}
                  </button>
                ) : (
                  <button
                    className="capmodalrel-btn primary"
                    disabled={totalSelecionados === 0 || saving || !isValid}
                    onClick={handleSave}
                  >
                    {saving ? (
                      <>
                        <span className="capmodalrel-spinner" /> Salvando...
                      </>
                    ) : (
                      "Salvar seleção"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapModalRelacional;

import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Clock, User, X } from "lucide-react";
import "../components/faultmonitoring/styles/FaultMonitoringSystem.css";
import {
  subscribeFms,
  unsubscribeFms,
  onFmsData,
  offFmsData,
  updateFms,
  getFmsById,
} from "../../api/fms.socket";
import { useAuth } from "../contexts/AuthContext";

const FaultMonitoringSystem = () => {
  const { getValidToken } = useAuth();
  const popoverRefs = useRef({});
  const [filters, setFilters] = useState({
    line: "",
    station: "",
    element: "",
    nivel: "",
  });
  const [now, setNow] = useState(Date.now());

  const [activeHistoryModal, setActiveHistoryModal] = useState({
    isOpen: false,
    fault: null,
  });

  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    faultId: null,
    nivel: null,
    isHistory: false,
  });
  const [comment, setComment] = useState("");
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    fault: null,
  });

  // --- MOCK DATA (Mantido conforme seu original) ---
  const [activeFaults, setActiveFaults] = useState([]);

  const [completedFaults, setCompletedFaults] = useState([]);

  const nivelConfig = {
    1: { name: "Condutor", class: "level-card--n1" },
    2: {
      name: "Team Leader",
      class: "level-card--n2",
    },
    3: { name: "Supervisor", class: "level-card--n3" },
    4: { name: "Shift Manager", class: "level-card--n4" },
    5: { name: "Shop Manager", class: "level-card--n5" },
  };

  useEffect(() => {
    // faz subscribe
    subscribeFms();

    // recebe dados do backend
    const handleFmsUpdate = (dados) => {
      console.log("FMS UPDATE:", dados);
      if (dados?.ativo) {
        setActiveFaults(dados.ativo);
      }

      if (dados?.historico) {
        setCompletedFaults(dados.historico);
      }
    };

    onFmsData(handleFmsUpdate);

    return () => {
      offFmsData(handleFmsUpdate);
      unsubscribeFms();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // --- HANDLERS ---
  const handleNotification = (faultId, nivel, isActive = true) => {
    setCommentModal({ isOpen: true, faultId, nivel, isHistory: !isActive });
  };

  const confirmNotification = async ({ alarmId, nivel }) => {
    if (!alarmId || !nivel) {
      console.warn("Confirmação sem alarmId ou nivel", {
        alarmId,
        nivel,
      });
      return;
    }

    try {
      const token = await getValidToken();

      await updateFms({
        alarmId,
        nivel,
        comment,
        token,
      });

      setCommentModal({
        isOpen: false,
        faultId: null,
        nivel: null,
        isHistory: false,
      });
      setComment("");
    } catch (err) {
      console.error("Erro ao confirmar notificação:", err.message);
      // opcional: toast / alert / modal
    }
  };

  const formatStartTime = (startTime) => {
    if (!startTime) return "-";

    return new Date(startTime).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    return `${Math.round(minutes)}min`;
  };

  const formatDurationMMSS = (minutes) => {
    if (!minutes || isNaN(minutes)) return "00:00";

    const totalSeconds = Math.round(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatDurationFromStart = (startTime) => {
    if (!startTime) return "00:00";

    const start = new Date(startTime).getTime();
    const diffMs = now - start;

    if (diffMs < 0) return "00:00";

    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <div className="fault-monitor">
      <div className="fault-monitor__container">
        {/*    <h1 className="fault-monitor__title">
          Sistema de Monitoramento de Falhas
        </h1> */}

        {/* Dashboard Grid */}
        <div className="fault-monitor__grid">
          {[1, 2, 3, 4, 5].map((n) => {
            const faults = activeFaults.filter((f) => f.nivel === n);
            return (
              <div key={n} className={`level-card ${nivelConfig[n].class}`}>
                <div className="level-card__header">
                  <h2 className="level-card__title">Nível {n}</h2>
                  <p className="level-card__subtitle">{nivelConfig[n].name}</p>
                  <span className="level-card__badge">
                    {faults.length} falha(s)
                  </span>
                </div>

                <div className="level-card__list">
                  {faults.map((fault) => (
                    <div
                      key={fault.id}
                      className="fault-item fault-item--clickable"
                      onClick={() =>
                        setActiveHistoryModal({ isOpen: true, fault })
                      }
                    >
                      <div className="fault-item__header">
                        <AlertCircle size={14} color="#ef4444" />
                        <span>
                          {fault.line} {fault.station} {fault.element}
                        </span>
                      </div>
                      <p className="fault-item__alarm" title={fault.alarm}>
                        {fault.alarm}
                      </p>
                      <div className="fault-item__duration">
                        <Clock size={12} />{" "}
                        <span>{formatDurationFromStart(fault.start_time)}</span>
                        <span className="fault-item__start-time">
                          {" "}
                          desde {formatStartTime(fault.start_time)}
                        </span>
                      </div>

                      <div className="notification-group">
                        {[1, 2, 3, 4, 5].map((idx) => {
                          const notif = fault.notifications[`nivel${idx}`];
                          const isConfirmed = notif.confirmed;
                          const canAction = idx <= fault.nivel;

                          let btnClass = "notification-btn";
                          if (isConfirmed)
                            btnClass += " notification-btn--confirmed";
                          else if (canAction)
                            btnClass += " notification-btn--active";
                          else btnClass += " notification-btn--disabled";

                          return (
                            <div
                              className="notification-action-wrapper"
                              onMouseEnter={() => {
                                const ref =
                                  popoverRefs.current[`${fault.id}-${idx}`];
                                if (ref) {
                                  setTimeout(() => ref.focus(), 0);
                                }
                              }}
                            >
                              {" "}
                              <button
                                className={btnClass}
                                disabled={!canAction}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCommentModal({
                                    isOpen: true,
                                    faultId: fault.id,
                                    nivel: idx,
                                    isHistory: false,
                                  });
                                  setComment("");
                                }}
                              >
                                {isConfirmed ? (
                                  <CheckCircle size={12} />
                                ) : (
                                  <User size={12} />
                                )}
                                <span>{idx}</span>
                              </button>
                              {canAction && !isConfirmed && (
                                <div
                                  className="notification-popover"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <textarea
                                    ref={(el) =>
                                      (popoverRefs.current[
                                        `${fault.id}-${idx}`
                                      ] = el)
                                    }
                                    placeholder="Adicionar comentário..."
                                    value={comment}
                                    rows={2}
                                    onChange={(e) => setComment(e.target.value)}
                                  />

                                  <button
                                    className="notification-confirm-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmNotification({
                                        alarmId: fault.id,
                                        nivel: idx,
                                      });
                                    }}
                                  >
                                    Confirmar
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Histórico Table */}
        {/* Histórico Table */}
        <div className="history-section">
          <h2 className="history-table__title">
            Histórico de Falhas Concluídas
          </h2>

          {/* wrapper scrollável */}

          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Linha</th>
                  <th>Estação</th>
                  <th>Elemento</th>
                  <th>Alarme</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Duração</th>
                  <th>Nível</th>
                  <th>Notificações</th>
                </tr>
              </thead>
              <tbody>
                {completedFaults.map((fault) => (
                  <tr
                    key={fault.id}
                    className="history-table__row"
                    onClick={() => setHistoryModal({ isOpen: true, fault })}
                  >
                    <td>{fault.line}</td>
                    <td>{fault.station}</td>
                    <td>{fault.element}</td>
                    <td>{fault.alarm}</td>
                    <td>{formatStartTime(fault.start_time)}</td>
                    <td>
                      {fault.end_time ? formatStartTime(fault.end_time) : "-"}
                    </td>
                    <td>{formatDurationMMSS(fault.duration_min)}</td>
                    <td>N{fault.nivel}</td>
                    <td>
                      <div className="notification-group">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className={`notification-btn ${
                              fault.notifications[`nivel${n}`].confirmed
                                ? "notification-btn--confirmed"
                                : "notification-btn--disabled"
                            }`}
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Comentário */}
      {commentModal.isOpen && (
        <div
          className="modal-overlay_fms"
          onClick={() => setCommentModal({ isOpen: false })}
        >
          <div
            className="modal-content_fms"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h3>
                Confirmar Comunicação ao {nivelConfig[commentModal.nivel].name}
              </h3>
              <button onClick={() => setCommentModal({ isOpen: false })}>
                <X size={20} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Comentário Adicional</label>
              <textarea
                className="form-input"
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--secondary"
                onClick={() => setCommentModal({ isOpen: false })}
              >
                Cancelar
              </button>
              <button
                className="btn btn--primary"
                onClick={() =>
                  confirmNotification({
                    alarmId: commentModal.faultId,
                    nivel: commentModal.nivel,
                  })
                }
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE ATIVOS */}
      {activeHistoryModal.isOpen && activeHistoryModal.fault && (
        <div
          className="modal-overlay_fms"
          onClick={() => setActiveHistoryModal({ isOpen: false, fault: null })}
        >
          <div
            className="modal-content_fms history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="history-modal__header">
              <h3>
                Histórico de Comentários — Falha #{activeHistoryModal.fault.id}
              </h3>
              <button
                className="notification-btn"
                onClick={() =>
                  setActiveHistoryModal({ isOpen: false, fault: null })
                }
              >
                <X size={20} />
              </button>
            </header>

            <div className="history-modal__body">
              {/* Resumo */}
              <section className="info-summary">
                <div>
                  <span className="info-summary__label">Linha:</span>
                  <span>
                    {activeHistoryModal.fault.line}{" "}
                    {activeHistoryModal.fault.station}
                  </span>
                </div>
                <div className="info-summary__item--full">
                  <span className="info-summary__label">Alarme:</span>
                  <p>{activeHistoryModal.fault.alarm}</p>
                </div>
                <div>
                  <span className="info-summary__label">Duração:</span>
                  <span>
                    {formatDuration(activeHistoryModal.fault.duration_min)}
                  </span>
                </div>
              </section>

              {/* Timeline */}
              <section>
                <h4 className="history-section-title">Linha do Tempo</h4>

                <div className="notification-log">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const notif =
                      activeHistoryModal.fault.notifications[`nivel${n}`];
                    if (!notif.confirmed) return null;

                    return (
                      <div key={n} className="notification-log__item">
                        <div className="notification-log__header">
                          <div className={`level-card--n${n}`}>
                            <span className="level-card__badge">
                              Nível {n} · {nivelConfig[n].name}
                            </span>
                          </div>

                          <span className="notification-log__meta">
                            {new Date(notif.confirmedAt).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                        </div>

                        {notif.comments.length > 0 ? (
                          notif.comments.map((c, idx) => (
                            <div key={idx} className="comment-bubble">
                              <p className="comment-bubble__text">{c.text}</p>
                              <span className="comment-bubble__date">
                                {c.user} -{" "}
                                {new Date(c.timestamp).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="empty-state">
                            Nível confirmado sem comentário
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico Detalhado */}
      {historyModal.isOpen && historyModal.fault && (
        <div
          className="modal-overlay"
          onClick={() => setHistoryModal({ isOpen: false, fault: null })}
        >
          <div
            className="modal-content_fms history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Sticky */}
            <header className="history-modal__header">
              <h3 className="fault-monitor__title" style={{ margin: 0 }}>
                Histórico Detalhado - Falha #{historyModal.fault.id}
              </h3>
              <button
                className="notification-btn"
                onClick={() => setHistoryModal({ isOpen: false, fault: null })}
              >
                <X size={24} />
              </button>
            </header>

            <div className="history-modal__body">
              {/* Resumo da Falha */}
              <section className="info-summary">
                <div>
                  <span className="info-summary__label">Linha:</span>
                  <span>{historyModal.fault.line}</span>
                </div>
                <div>
                  <span className="info-summary__label">Estação:</span>
                  <span>{historyModal.fault.station}</span>
                </div>
                <div>
                  <span className="info-summary__label">Componente:</span>
                  <span>{historyModal.fault.element}</span>
                </div>
                <div>
                  <span className="info-summary__label">Duração:</span>
                  <span>
                    {formatDurationMMSS(historyModal.fault.duration_min)}
                  </span>
                </div>
                <div className="info-summary__item--full">
                  <span className="info-summary__label">Alarme:</span>
                  <p>{historyModal.fault.alarm}</p>
                </div>
                <div>
                  <span className="info-summary__label">Início:</span>
                  <span>{formatStartTime(historyModal.fault.start_time)}</span>
                </div>
                <div>
                  <span className="info-summary__label">Fim:</span>
                  <span>
                    {historyModal.fault.end_time
                      ? formatStartTime(historyModal.fault.end_time)
                      : "-"}
                  </span>
                </div>
              </section>

              {/* Timeline de Notificações */}
              <section>
                <h4 className="history-section-title">
                  Histórico de Notificações
                </h4>
                <div className="notification-log">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const notification =
                      historyModal.fault.notifications[`nivel${n}`];
                    if (!notification.confirmed) return null;

                    return (
                      <div key={n} className="notification-log__item">
                        <div className="notification-log__header">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div className={`level-card--n${n}`}>
                              <span className="level-card__badge">
                                Nível {n}
                              </span>
                            </div>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                color: "#000",
                              }}
                            >
                              {nivelConfig[n].name}
                            </span>
                          </div>
                          <span className="notification-log__meta">
                            Confirmado em:{" "}
                            {new Date(notification.confirmedAt).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                        </div>

                        {notification.comments.length > 0 ? (
                          notification.comments.map((c, idx) => (
                            <div key={idx} className="comment-bubble">
                              <p className="comment-bubble__text">{c.text}</p>
                              <span className="comment-bubble__date">
                                {new Date(c.timestamp).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p
                            className="empty-state"
                            style={{ padding: "0.5rem" }}
                          >
                            Sem comentários neste nível
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Seção de Encerramento */}
              {/* <section className="closure-log">
                <div className="history-section-title">
                  <span>Observações de Encerramento</span>
                  <button
                    className="btn btn--primary"
                    style={{ flex: "none", fontSize: "0.75rem" }}
                    onClick={() =>
                      handleNotification(historyModal.fault.id, null, false)
                    }
                  >
                    + Adicionar Observação
                  </button>
                </div>

                {historyModal.fault.closureComments &&
                historyModal.fault.closureComments.length > 0 ? (
                  historyModal.fault.closureComments.map((comment, idx) => (
                    <div key={idx} className="closure-card">
                      <p className="closure-card__text">{comment.text}</p>
                      <div className="closure-card__footer">
                        <span>
                          <User size={12} style={{ marginRight: "4px" }} />{" "}
                          {comment.user}
                        </span>
                        <span>
                          {new Date(comment.timestamp).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    Nenhuma observação de encerramento registrada.
                  </div>
                )}
              </section> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaultMonitoringSystem;

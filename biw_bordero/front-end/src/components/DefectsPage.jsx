import React, { useState, useRef } from "react";
import QuadrantGrid from "../components/defeitos/QuadrantGrid";
import FilterBar from "../components/defeitos/FilterBar";
import {
  modelos,
  turnos,
  defeitos,
} from "../components/defeitos/FilterBar.jsx";
import "./defeitos/styles/DefectsPage.css";
import { createDefeito, validateDefeitoData } from "../../api/defeitos.http.js";

const DefectsPage = () => {
  const [selectedQuadrant, setSelectedQuadrant] = useState(null);
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ref para o FilterBar (para resetar o defeito)
  const filterBarRef = useRef();

  // TOAST
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  // -----------------------
  // ATUALIZA FILTROS
  // -----------------------
  const handleFilterChange = (newFilters) => {
    if (newFilters.modelo !== filters.modelo) {
      setSelectedQuadrant(null);
    }
    setFilters(newFilters);
  };

  // -----------------------
  // SELEÇÃO DO QUADRANTE
  // -----------------------
  const handleQuadrantSelection = (quadrantData) => {
    setSelectedQuadrant((prev) => {
      if (prev && prev.id === quadrantData.id) {
        return null;
      }
      return quadrantData;
    });
  };

  // -----------------------
  // FUNÇÃO PARA RESETAR O DEFEITO
  // -----------------------
  const resetDefeito = () => {
    // Limpa o defeito no estado do FilterBar via ref
    if (filterBarRef.current) {
      filterBarRef.current.resetDefeito();
    }
    // Também limpa no estado local
    setFilters((prev) => ({ ...prev, defeito: "" }));
  };

  // -----------------------
  // VALIDAR CAMPOS E ABRIR MODAL
  // -----------------------
  const handleSalvarClick = () => {
    if (!filters.date) {
      showToast("Selecione uma data.", "error");
      return;
    }

    const turnoNumero = Number(filters.turno);
    if (
      !filters.turno ||
      isNaN(turnoNumero) ||
      ![1, 2, 3].includes(turnoNumero)
    ) {
      showToast("Selecione um turno válido (1, 2 ou 3).", "error");
      return;
    }

    if (!filters.modelo) {
      showToast("Selecione um modelo.", "error");
      return;
    }

    if (!selectedQuadrant) {
      showToast("Selecione um quadrante.", "error");
      return;
    }

    if (!filters.defeito || filters.defeito.trim() === "") {
      showToast("Selecione um defeito.", "error");
      return;
    }

    setShowModal(true);
  };

  // -----------------------
  // CONFIRMAR ENVIO
  // -----------------------
  const handleConfirmarEnvio = async () => {
    setIsSaving(true);
    setShowModal(false);

    const turnoNumero = Number(filters.turno);

    if (isNaN(turnoNumero) || ![1, 2, 3].includes(turnoNumero)) {
      showToast("Turno inválido. Selecione 1, 2 ou 3.", "error");
      setIsSaving(false);
      return;
    }

    const dadosParaEnviar = {
      data: filters.date,
      turno: turnoNumero,
      modelo: filters.modelo,
      visao: selectedQuadrant.visao,
      area: selectedQuadrant.area,
      numeroQuadrante: selectedQuadrant.numero,
      defeito: filters.defeito,
      observacoes: filters.observacoes || "",
      registradoEm: new Date().toISOString(),
    };

    const validation = validateDefeitoData(dadosParaEnviar);
    if (!validation.valid) {
      showToast(validation.errors.join(", "), "error");
      setIsSaving(false);
      return;
    }

    try {
      const response = await createDefeito(dadosParaEnviar);
      showToast("Registro salvo com sucesso!", "success");

      // LIMPA O DEFEITO APÓS SALVAR
      resetDefeito();

      // Limpa o quadrante selecionado
      setSelectedQuadrant(null);
    } catch (error) {
      console.error("❌ Erro ao salvar defeito:", error);

      let errorMessage = "Erro ao salvar registro.";

      if (error.status === 400) {
        errorMessage = "Dados inválidos. Verifique os campos.";
      } else if (error.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      } else if (error.status === 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde.";
      }

      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelarEnvio = () => {
    setShowModal(false);
  };

  return (
    <div className="defects-page__container">
      <FilterBar
        ref={filterBarRef} // ← ADICIONA A REF
        onFilterChange={handleFilterChange}
        selectedQuadrant={selectedQuadrant?.id}
        onSaveClick={handleSalvarClick}
        isSaving={isSaving}
        onDefeitoReset={resetDefeito} // ← PASSA A FUNÇÃO DE RESET
      />

      {filters.modelo && (
        <QuadrantGrid
          onSelectQuadrant={handleQuadrantSelection}
          selectedQuadrant={selectedQuadrant}
          modelo={filters.modelo}
        />
      )}

      {/* MODAL */}
      {showModal && (
        <div className="defectsmodal__overlay">
          <div className="defectsmodal__box">
            <h3 className="defectsmodal__title">Confirmar envio?</h3>

            <div className="defectsmodal__info-box">
              <div className="defectsmodal__form-group">
                <label className="defectsmodal__label">Data</label>
                <span className="defectsmodal__text">
                  {filters.date
                    ? filters.date.split("-").reverse().join("/")
                    : ""}
                </span>
              </div>

              <div className="defectsmodal__form-group">
                <label className="defectsmodal__label">Turno</label>
                <span className="defectsmodal__text">
                  {filters.turno ? `Turno ${filters.turno}` : "Não selecionado"}
                </span>
              </div>

              <div className="defectsmodal__form-group">
                <label className="defectsmodal__label">Modelo</label>
                <span className="defectsmodal__text">{filters.modelo}</span>
              </div>

              <div className="defectsmodal__form-group">
                <label className="defectsmodal__label">Visão</label>
                <span className="defectsmodal__text">
                  {selectedQuadrant?.visaoNome || selectedQuadrant?.visao || ""}
                </span>
              </div>

              <div className="defectsmodal__form-group">
                <label className="defectsmodal__label">Área</label>
                <span className="defectsmodal__text">
                  {selectedQuadrant?.area || ""}
                </span>
              </div>

              <div className="defectsmodal__form-group">
                <label className="defectsmodal__label">Quadrante</label>
                <span className="defectsmodal__text">
                  {selectedQuadrant?.numero || ""}
                </span>
              </div>

              <div className="defectsmodal__form-group">
                <label className="defectsmodal__label">Defeito</label>
                <span className="defectsmodal__text">{filters.defeito}</span>
              </div>
            </div>

            <div className="defectsmodal__buttons">
              <button
                className="defectsmodal__confirm"
                onClick={handleConfirmarEnvio}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Confirmar"}
              </button>
              <button
                className="defectsmodal__cancel"
                onClick={handleCancelarEnvio}
                disabled={isSaving}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.message && (
        <div className={`defects-toast defects-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default DefectsPage;

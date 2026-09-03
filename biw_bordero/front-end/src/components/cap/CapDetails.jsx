import React, { useState, useMemo, useEffect, useRef } from "react";
import "./styles/CapDetails.css";
import {
  createJustificativa,
  getAlarmesDisponiveisAlocacao,
} from "../../../api/cap.http.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { formatMinutesToHHMMSS } from "./utils/capUtils.js";
import {
  CAUSAS,
  MODO_FALHA,
  COMPONENTE,
  CAUSAS_NAO_APLICA,
  causaMap,
} from "./utils/capConstant.js";
import CapModalRelacional from "./CapModalRelacional.jsx";
import { FilterComboBox } from "./common/FilterComboBox.jsx";
import Button from "../common/Button.jsx";
import { useMantenedores } from "./hooks/CapPage/hooks.jsx";

export const CAP_SALVAMENTOS = [];

// ─── Sub-componentes visuais ──────────────────────────────────────────────────

const SectionDivider = ({ label }) => (
  <div className="cd-divider">
    <span className="cd-divider__label">{label}</span>
  </div>
);

const InfoChip = ({ label, value }) => (
  <div className="cd-chip">
    <span className="cd-chip__label">{label}</span>
    <span className="cd-chip__value">{value}</span>
  </div>
);

// O hook useMantenedores já está correto, retornando:
// [{ id: "1", mantenedor: "CARLOS SANTOS - MIG" }, ...]

const MantenedorBlock = ({ form, setForm, mantenedores, hasError }) => (
  <div className="cd-mantenedor">
    <label className="cd-checkbox">
      <input
        type="checkbox"
        checked={form.resolvidoPorMim}
        onChange={(e) => {
          const checked = e.target.checked;
          setForm((prev) => ({
            ...prev,
            resolvidoPorMim: checked,
            mantenedor: checked ? null : prev.mantenedor,
            mantenedorLivre: checked ? "" : prev.mantenedorLivre,
          }));
        }}
      />
      <span>Resolvido por mim</span>
    </label>

    {!form.resolvidoPorMim && (
      <div className="cd-mantenedor__search">
        <FilterComboBox
          id="mantenedor"
          label="Mantenedor responsável"
          value={form.mantenedor?.mantenedor ?? ""}
          onChange={(nomeSelecionado) => {
            const encontrado = mantenedores.find(
              (m) => m.mantenedor === nomeSelecionado,
            );
            setForm((prev) => ({
              ...prev,
              mantenedor: encontrado ?? null,
              mantenedorLivre: "",
            }));
          }}
          options={mantenedores.map((m) => m.mantenedor)}
          hasError={hasError}
        />
        {!form.mantenedor && (
          <input
            type="text"
            className="cd-input-livre"
            placeholder="Não encontrou? Digite o nome manualmente"
            value={form.mantenedorLivre}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, mantenedorLivre: e.target.value }))
            }
          />
        )}
      </div>
    )}
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const CapDetails = ({
  selectedRows = [],
  selectedHour,
  selectedDate,
  maquinas = [],
  onReset,
  onSaved,
}) => {
  const { showToast } = useToast();
  const mantenedores = useMantenedores(); // Usando o hook sem filtro

  // Ref para a área de diagnóstico
  const diagnosticoRef = useRef(null);

  const [form, setForm] = useState({
    causaRaiz: "",
    maquina: "",
    component: "",
    modoFalha: "",
    descricao: "",
    resolvidoPorMim: false,
    mantenedor: null,
    mantenedorLivre: "",
  });

  const [errors, setErrors] = useState({});
  const [openRelacional, setOpenRelacional] = useState(false);
  const [alarmesDisponiveis, setAlarmesDisponiveis] = useState([]);
  const [loadingRelacional, setLoadingRelacional] = useState(false);
  const [relacao, setRelacao] = useState({
    ids: [],
    naoEncontrado: false,
    comentario: "",
  });

  const jaRelacionou = relacao.ids.length > 0;
  const relacaoOk = jaRelacionou || relacao.naoEncontrado;

  const isFalta = ["FALTA ALIMENTAÇÃO", "FALTA ABSORÇÃO"].includes(
    form.causaRaiz,
  );
  const isFalhaEquipamento = form.causaRaiz === "FALHA EQUIPAMENTO";

  // Função para rolar até a área de diagnóstico
  const scrollToDiagnostico = () => {
    if (diagnosticoRef.current) {
      diagnosticoRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // ── Derivados ──
  // const duracaoTotal = useMemo(() => {
  //   const total = selectedRows.reduce(
  //     (acc, item) => acc + (Number(item?.losstime_min) || 0),
  //     0,
  //   );
  //   return Number(total.toFixed(5));
  // }, [selectedRows]);

  const isManual = selectedRows.length === 1 && selectedRows[0]?.isManual;

  const duracaoTotal = useMemo(() => {
    if (isManual) {
      return Number(selectedRows[0]?.losstime_min || 0);
    }

    const total = selectedRows.reduce(
      (acc, item) => acc + (Number(item?.losstime_min) || 0),
      0,
    );

    return Number(total.toFixed(5));
  }, [selectedRows, isManual]);

  // ── Regra automática NÃO SE APLICA ──
  useEffect(() => {
    if (CAUSAS_NAO_APLICA.includes(form.causaRaiz)) {
      setForm((prev) => ({
        ...prev,
        component: "NÃO SE APLICA",
        modoFalha: "NÃO SE APLICA",
      }));
    }
  }, [form.causaRaiz]);

  // ── Handler genérico com scroll automático ──
  const handleChange = async (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Se for Causa Raiz e for Falta, rola para diagnóstico
    if (
      field === "causaRaiz" &&
      (value === "FALTA ALIMENTAÇÃO" || value === "FALTA ABSORÇÃO")
    ) {
      scrollToDiagnostico();
    }

    if (field !== "causaRaiz") return;
    if (value !== "FALTA ALIMENTAÇÃO" && value !== "FALTA ABSORÇÃO") return;

    try {
      setLoadingRelacional(true);
      const res = await getAlarmesDisponiveisAlocacao({
        linha: selectedRows[0]?.line,
        causa: causaMap[value],
        ts_inicio: selectedRows[0]?.ts_inicio,
      });
      if (res.data?.alarmes?.length) {
        setAlarmesDisponiveis(res.data);
        setOpenRelacional(true);
      } else {
        showToast("Nenhum alarme disponível encontrado", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao buscar alarmes disponíveis", "error");
    } finally {
      setLoadingRelacional(false);
    }
  };

  // Handler para clique em qualquer componente da área de diagnóstico
  const handleDiagnosticoClick = (e) => {
    // Verifica se o clique foi em algum elemento dentro da área de diagnóstico
    // e então rola para baixo
    scrollToDiagnostico();
  };

  // ── Validação ──
  const validateForm = () => {
    const newErrors = {
      maquina: !maquinas.includes(form.maquina),
      causaRaiz: !CAUSAS.includes(form.causaRaiz),
      modoFalha: !MODO_FALHA.includes(form.modoFalha),
      component: !COMPONENTE.includes(form.component),
    };

    if (isFalta) {
      const ok =
        relacao.ids.length > 0 ||
        (relacao.naoEncontrado && relacao.comentario.length > 2);
      if (!ok) {
        alert(
          "Para 'FALTA DE ALIMENTAÇÃO' ou 'FALTA DE ABSORÇÃO', selecione alarmes relacionados ou marque 'Não Encontrado' com comentário.",
        );
        return false;
      }
    }

    if (isFalhaEquipamento) {
      if (
        form.component === "NÃO SE APLICA" ||
        form.modoFalha === "NÃO SE APLICA"
      ) {
        alert(
          "Para 'FALHA EQUIPAMENTO', Componente e Modo de Falha não podem ser 'NÃO SE APLICA'.",
        );
        return false;
      }
      const temMantenedor =
        form.resolvidoPorMim ||
        form.mantenedor?.id != null ||
        form.mantenedorLivre.trim().length > 1;
      if (!temMantenedor) {
        alert(
          "Para 'FALHA EQUIPAMENTO', informe o mantenedor ou marque 'Resolvido por mim'.",
        );
        newErrors.mantenedor = true;
        setErrors(newErrors);
        return false;
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // ── Salvar ──
  const handleSalvar = async () => {
    if (!validateForm()) return;

    const payload = {
      linha: selectedRows[0]?.line || null,
      data: selectedDate,
      horaselecionada: selectedHour,
      alarms: isManual ? [] : selectedRows.map((item) => item.id),
      relacionado: relacao.ids,
      descricao: form.modoFalha,
      causa_raiz: form.causaRaiz,
      dur_min: duracaoTotal,
      maquina: form.maquina,
      componente: form.component,
      comentario: relacao.naoEncontrado ? relacao.comentario : form.descricao,
      resolvido_por_mim: form.resolvidoPorMim || false,
      mantenedor_id: form.resolvidoPorMim
        ? null
        : (form.mantenedor?.id ?? null),
      mantenedor_nome_livre: form.resolvidoPorMim
        ? null
        : form.mantenedorLivre.trim() || null,
    };

    try {
      await createJustificativa(payload);
      showToast("Justificativa salva com sucesso ✅", "success");
      setRelacao({ ids: [], naoEncontrado: false, comentario: "" });
      setForm({
        causaRaiz: "",
        maquina: "",
        component: "",
        modoFalha: "",
        descricao: "",
        resolvidoPorMim: false,
        mantenedor: null,
        mantenedorLivre: "",
      });
      onReset?.();
      onSaved?.();
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar justificativa", "error");
    }
  };

  // ── Empty state ──
  if (!selectedRows.length) {
    return (
      <div className="cap-details cap-details--empty">
        <span className="cap-details--empty__icon">📋</span>
        <p>Selecione eventos na tabela para justificar</p>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="cap-details">
      {/* Cabeçalho */}
      <div className="cd-header">
        <h3 className="cd-header__title">Justificar Eventos</h3>
        <div className="cd-header__chips">
          <InfoChip label="Eventos" value={selectedRows.length} />
          <InfoChip
            label="Duração"
            value={formatMinutesToHHMMSS(duracaoTotal)}
          />
        </div>
      </div>

      {/* Formulário */}
      <div className="cd-form">
        {/* Causa Raiz */}
        <div
          className={`cd-field-row${isFalta ? " cd-field-row--with-btn" : ""}`}
        >
          <FilterComboBox
            id="causaRaiz"
            label="Causa Raiz"
            value={form.causaRaiz}
            onChange={(v) => handleChange("causaRaiz", v)}
            options={CAUSAS}
            hasError={errors.causaRaiz}
          />
          {isFalta && (
            <button
              type="button"
              className={`cd-relacional-btn ${relacaoOk ? "ok" : "pending"}`}
              onClick={() => setOpenRelacional(true)}
            >
              {relacaoOk ? "✔ Vinculado" : "Vincular perda"}
            </button>
          )}
        </div>

        {/* Bloco mantenedor — aparece logo abaixo de Causa Raiz */}
        {isFalhaEquipamento && (
          <MantenedorBlock
            form={form}
            setForm={setForm}
            mantenedores={mantenedores}
            hasError={errors.mantenedor}
          />
        )}

        {/* Máquina */}
        <FilterComboBox
          id="maquina"
          label="Máquina"
          value={form.maquina}
          onChange={(v) => handleChange("maquina", v)}
          options={maquinas}
          hasError={errors.maquina}
        />

        <SectionDivider label="Diagnóstico" />

        {/* Área de diagnóstico com ref e onClick */}
        <div
          ref={diagnosticoRef}
          className="cd-diagnostico-area"
          onClick={handleDiagnosticoClick}
        >
          {/* Componente + Modo de Falha — 2 colunas */}
          <div className="cd-row-2">
            <FilterComboBox
              id="component"
              label="Componente"
              value={form.component}
              onChange={(v) => {
                handleChange("component", v);
                scrollToDiagnostico();
              }}
              options={COMPONENTE}
              hasError={errors.component}
            />
            <FilterComboBox
              id="modoFalha"
              label="Modo de Falha"
              value={form.modoFalha}
              onChange={(v) => {
                handleChange("modoFalha", v);
                scrollToDiagnostico();
              }}
              options={MODO_FALHA}
              hasError={errors.modoFalha}
            />
          </div>

          {/* Comentário */}
          <div className="cd-field">
            <label className="cd-label" htmlFor="descricao">
              Comentário <span className="cd-label__optional">(opcional)</span>
            </label>
            <textarea
              id="descricao"
              className="cd-textarea"
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              onClick={scrollToDiagnostico}
              rows={2}
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        {/* Ação */}
        <div className="cd-actions">
          <Button variant="primary" onClick={handleSalvar}>
            Salvar justificativa
          </Button>
        </div>
      </div>

      {/* Modal relacional */}
      <CapModalRelacional
        open={openRelacional}
        onClose={() => setOpenRelacional(false)}
        initialState={relacao}
        onSave={(resultado) => {
          setRelacao(resultado);
          if (resultado.naoEncontrado) {
            setForm((prev) => ({ ...prev, descricao: resultado.comentario }));
          }
        }}
        data={alarmesDisponiveis.alarmes}
        linhas={alarmesDisponiveis.linhas}
        horas={alarmesDisponiveis.horas}
        loading={loadingRelacional}
        duracaoTarget={duracaoTotal}
      />
    </div>
  );
};

export default CapDetails;

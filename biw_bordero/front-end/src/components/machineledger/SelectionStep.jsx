// SelectionStep.jsx - DRY, sem props drilling
import { StepCard } from "./StepCard";
import { C } from "./data/theme";
import ComponentesList from "./ComponentesList";
import LoadingSpinner from "../common/LoadingSpinner";
import { useNavigation } from "./contexts/NavigationContext";

export const SelectionStep = ({
  options,
  onAddToCart,
  onRemoveFromCart,
  cartItems,
  loading,
}) => {
  const { step, selection, selectLevel, selectComponent } = useNavigation();
  const flexWrap = { display: "flex", gap: 12, flexWrap: "wrap" };

  const currentOptionsMap = {
    ute: options.utes,
    linha: options.linhas,
    operacao: options.operacoes,
    tipoMaquina: options.tiposMaquina,
    maquina: options.maquinas,
    componentes: options.componentes,
  };

  const currentList = currentOptionsMap[step] || [];
  const isLoading = loading?.[step];

  if (isLoading && currentList.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <LoadingSpinner />
      </div>
    );
  }

  const withOverlay = (content) => (
    <div style={{ position: "relative" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            fontSize: 12,
            color: C.muted,
            background: "rgba(255,255,255,0.7)",
            padding: "2px 8px",
            borderRadius: 6,
          }}
        >
          Atualizando...
        </div>
      )}
      {content}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case "ute":
        return (
          <div style={flexWrap}>
            {options.utes.map((ute) => (
              <StepCard
                key={ute.id}
                title={ute.label}
                count={ute.count}
                countType={ute.countType}
                width={160}
                type="ute"
                onClick={() => selectLevel("ute", ute.id)}
              />
            ))}
          </div>
        );

      case "linha":
        return (
          <div style={flexWrap}>
            {options.linhas.map((linha) => (
              <StepCard
                key={linha.id}
                title={linha.label}
                count={linha.count}
                countType={linha.countType}
                width={140}
                type="linha"
                onClick={() => selectLevel("linha", linha.id)}
              />
            ))}
          </div>
        );

      case "operacao":
        return (
          <div style={flexWrap}>
            {options.operacoes.map((op) => (
              <StepCard
                key={op.id}
                title={op.label}
                count={op.count}
                countType={op.countType}
                width={130}
                type="operacao"
                onClick={() => selectLevel("operacao", op.id)}
              />
            ))}
          </div>
        );

      case "tipoMaquina":
        return (
          <div style={{ ...flexWrap, gap: 16 }}>
            {options.tiposMaquina.map((tipo) => (
              <StepCard
                key={tipo.id}
                title={tipo.label}
                tipoId={tipo.codTipoMaquina}
                width={260}
                type="tipoMaquina"
                count={tipo.count}
                countType={tipo.countType}
                subCount={tipo.subCount}
                subCountType={tipo.subCountType}
                onClick={() => selectLevel("tipoMaquina", tipo)}
              />
            ))}
          </div>
        );

      case "maquina":
        return (
          <>
            {selection.tipoMaquina && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                  background: C.accentMut,
                  border: `1px solid ${C.accentLo}`,
                  borderRadius: 8,
                  padding: "5px 12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: C.accent,
                    fontSize: 13,
                  }}
                >
                  {selection.tipoMaquina.id}
                </span>
                <span style={{ color: C.gray300, fontSize: 12 }}>·</span>
                <span style={{ color: C.dark, fontSize: 12 }}>
                  {selection.tipoMaquina.label}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {options.maquinas.map((maquina) => (
                <StepCard
                  key={maquina.id}
                  title={maquina.label}
                  tipoId={selection.tipoMaquina?.codTipoMaquina}
                  width={220}
                  type="maquina"
                  count={maquina.count}
                  countType={maquina.countType}
                  onClick={() => selectLevel("maquina", maquina.id)}
                />
              ))}
            </div>
          </>
        );

      case "componentes":
        return (
          <ComponentesList
            items={options.componentes}
            machineId={selection.maquina}
            tipoMaquina={selection.tipoMaquina}
            filterComponente={selection.filterComponente}
            onRemoveFromCart={onRemoveFromCart}
            onAddToCart={onAddToCart}
            cartItems={cartItems}
            onSelectComponent={selectComponent}
          />
        );

      default:
        return null;
    }
  };

  return withOverlay(renderStepContent());
};

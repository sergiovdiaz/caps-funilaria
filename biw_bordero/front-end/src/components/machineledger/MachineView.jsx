import { useRef, useState, useEffect } from "react";
import { C } from "./data/theme.js";
import { MACHINE_IMAGES } from "./utils/machineImages.js";

/**
 * MachineView - Versão simplificada semelhante ao MachineThumbnail
 *
 * Props:
 *   machineId   — ID da máquina (usado para buscar a imagem em MACHINE_IMAGES)
 *   machineLabel— rótulo exibido abaixo da imagem (opcional)
 *   areas       — array de áreas clicáveis (opcional)
 *   selectedArea — id da área selecionada
 *   onAreaClick  — callback quando uma área é clicada
 *   maxHeight    — altura máxima da imagem em pixels (padrão: 180)
 */
const MachineView = ({
  machineId,
  machineLabel,
  areas = [],
  selectedArea = null,
  onAreaClick = () => {},
  maxHeight = 400, // altura máxima da imagem
}) => {
  const image = MACHINE_IMAGES[machineId];
  const imgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [containerWidth, setContainerWidth] = useState(0);

  const updateScale = () => {
    if (imgRef.current && imgDimensions.width) {
      const currentWidth = imgRef.current.clientWidth;
      setScale(currentWidth / imgDimensions.width);
      setContainerWidth(currentWidth);
    }
  };

  const handleImageLoad = (e) => {
    setImgDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight,
    });
    updateScale();
  };

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [imgDimensions.width]);

  const handleAreaClick = (areaId) => {
    onAreaClick(selectedArea === areaId ? null : areaId);
  };

  // Se não tem imagem, mostra placeholder
  if (!image) {
    return (
      <div
        style={{
          background: "#f0f3fb",
          borderRadius: 10,
          border: `1px solid ${C.borderLt}`,
          boxShadow: C.shadow,
          height: maxHeight,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 40, opacity: 0.25 }}>🏭</span>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: C.font }}>
          {machineLabel} - {machineId}
        </span>
        <span style={{ fontSize: 10, color: C.muted, fontFamily: C.font }}>
          Imagem não configurada
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* IMAGEM + ÁREAS */}
      <div
        style={{
          position: "relative",
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${C.borderLt}`,
          boxShadow: C.shadow,
          background: "#f0f3fb",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img
            ref={imgRef}
            src={image}
            alt={machineLabel || machineId}
            onLoad={handleImageLoad}
            style={{
              width: "auto",
              height: `${maxHeight}px`,
              maxWidth: "100%",
              display: "block",
              objectFit: "contain",
            }}
          />
        </div>

        {areas.map((area) => {
          const active = selectedArea === area.id;

          // Se não temos dimensões da imagem ainda, não renderiza áreas
          if (!imgDimensions.width) return null;

          // Calcula o scale baseado na largura real da imagem após redimensionamento
          const actualScale = containerWidth / imgDimensions.width;

          return (
            <div
              key={area.id}
              onClick={() => handleAreaClick(area.id)}
              style={{
                position: "absolute",
                left: area.x * actualScale,
                top: area.y * actualScale,
                width: area.width * actualScale,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                cursor: "pointer",
              }}
            >
              {/* Caixa da área */}
              <div
                style={{
                  width: "100%",
                  height: area.height * actualScale,
                  border: `3px solid ${active ? C.green : C.accent}`,
                  backgroundColor: active
                    ? "rgba(40,167,69,0.25)"
                    : "rgba(59,111,245,0.20)",
                  borderRadius: 6,
                  transition: "all 0.15s",
                  boxShadow: active
                    ? "0 0 0 2px rgba(255,255,255,0.8), 0 0 8px 2px rgba(40,167,69,0.5)"
                    : "0 0 0 2px rgba(255,255,255,0.8), 0 0 8px 2px rgba(59,111,245,0.4)",
                }}
              />

              {/* Label abaixo */}
              <div
                style={{
                  fontSize: Math.max(9, 10 * actualScale),
                  fontWeight: 700,
                  fontFamily: C.font,
                  color: "#fff",
                  background: active ? C.green : C.accent,
                  borderRadius: 6,
                  padding: "2px 8px",
                  whiteSpace: "normal",
                  lineHeight: 1.5,
                  pointerEvents: "none",
                  transition: "background 0.15s",
                  textAlign: "center",
                  letterSpacing: 0.3,
                  boxShadow: active
                    ? "0 2px 6px rgba(40,167,69,0.35)"
                    : "0 2px 6px rgba(59,111,245,0.30)",
                }}
              >
                {area.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* LABEL DA MÁQUINA */}
      {machineLabel && (
        <div
          onClick={() => onAreaClick(null)}
          style={{
            textAlign: "center",
            marginTop: 8,
            fontWeight: 600,
            fontSize: 13,
            color: C.textSec,
            fontFamily: C.font,
            cursor: "pointer",
            padding: "4px 0",
          }}
        >
          {machineLabel}
        </div>
      )}
    </div>
  );
};

export default MachineView;

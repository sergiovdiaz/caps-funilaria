import React, { useRef, useEffect, useState } from "react";
import "./styles/QuadrantGrid.css";

// Novos SVGs da RAM (Modelo 291)
import ramSx from "../../assets/images/quadrantes/ram_sx.svg";
import ramDx from "../../assets/images/quadrantes/ram_dx.svg";
import ramFrontal from "../../assets/images/quadrantes/ram_frontal.svg";
import ramTraseira from "../../assets/images/quadrantes/ram_traseira.svg";

import renegadeSx from "../../assets/images/quadrantes/renegade_sx.svg";
import renegadeDx from "../../assets/images/quadrantes/renegade_dx.svg";
import renegadeFrontal from "../../assets/images/quadrantes/renegade_frontal.svg";
import renegadeTraseira from "../../assets/images/quadrantes/renegade_traseira.svg";

import toroSx from "../../assets/images/quadrantes/toro_sx.svg";
import toroDx from "../../assets/images/quadrantes/toro_dx.svg";
import toroFrontal from "../../assets/images/quadrantes/toro_frontal.svg";
import toroTraseira from "../../assets/images/quadrantes/toro_traseira.svg";

import commanderSx from "../../assets/images/quadrantes/commander_sx.svg";
import commanderDx from "../../assets/images/quadrantes/commander_dx.svg";
import commanderFrontal from "../../assets/images/quadrantes/commander_frontal.svg";
import commanderTraseira from "../../assets/images/quadrantes/commander_traseira.svg";

import compassSx from "../../assets/images/quadrantes/compass_sx.svg";
import compassDx from "../../assets/images/quadrantes/compass_dx.svg";
import compassFrontal from "../../assets/images/quadrantes/compass_frontal.svg";
import compassTraseira from "../../assets/images/quadrantes/compass_traseira.svg";

// Mapeamento dinâmico
const svgMap = {
  291: {
    sx: ramSx,
    dx: ramDx,
    frontal: ramFrontal,
    traseira: ramTraseira,
  },
  521: {
    sx: renegadeSx,
    dx: renegadeDx,
    frontal: renegadeFrontal,
    traseira: renegadeTraseira,
  },
  598: {
    sx: commanderSx,
    dx: commanderDx,
    frontal: commanderFrontal,
    traseira: commanderTraseira,
  },
  226: {
    sx: toroSx,
    dx: toroDx,
    frontal: toroFrontal,
    traseira: toroTraseira,
  },
  551: {
    sx: compassSx,
    dx: compassDx,
    frontal: compassFrontal,
    traseira: compassTraseira,
  },
};

// Função para extrair dados do ID do quadrante
// Formato esperado: visao_area_qN (ex: dx_portaTraseira_q4)
const extractQuadrantData = (id) => {
  if (!id) return null;

  // Divide o ID por underscore
  const parts = id.split("_");

  // Deve ter exatamente 3 partes: visao, area, quadrante
  if (parts.length !== 3) {
    console.warn(`Formato de ID inesperado: ${id}. Esperado: visao_area_qN`);
    return null;
  }

  const [visao, area, quadrante] = parts;

  // Verifica se o quadrante começa com 'q' e extrai o número
  if (!quadrante || !quadrante.startsWith("q")) {
    console.warn(`Formato de quadrante inválido: ${quadrante}. Esperado: qN`);
    return null;
  }

  const numeroQuadrante = parseInt(quadrante.replace("q", ""));

  if (isNaN(numeroQuadrante)) {
    console.warn(`Número de quadrante inválido: ${quadrante}`);
    return null;
  }

  // Mapeamento para nomes mais amigáveis
  const visaoMap = {
    dx: "Direita",
    sx: "Esquerda",
    frontal: "Frontal",
    traseira: "Traseira",
  };

  return {
    id: id,
    visao: visao, // "dx", "sx", "frontal", "traseira"
    visaoNome: visaoMap[visao] || visao,
    area: area, // "portaTraseira", "parachoque", "lateral"
    numero: numeroQuadrante, // 1, 2, 3, 4, 5, 6
    displayName: `${visaoMap[visao] || visao} - ${area} - Quadrante ${numeroQuadrante}`,
  };
};

// Subcomponente reutilizável para carregar e gerenciar cada SVG individualmente
const SvgCell = ({ src, selectedQuadrant, onSelectQuadrant, label }) => {
  const cellRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadSVG = async () => {
      if (!src) return;
      try {
        setError(null);
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const svgText = await response.text();
        if (!active) return;

        const wrapper = cellRef.current;
        if (!wrapper) return;

        const oldSvg = wrapper.querySelector("svg");
        if (oldSvg) oldSvg.remove();

        wrapper.insertAdjacentHTML("afterbegin", svgText);

        const svg = wrapper.querySelector("svg");
        if (svg) {
          const originalWidth = svg.getAttribute("width");
          const originalHeight = svg.getAttribute("height");

          svg.removeAttribute("width");
          svg.removeAttribute("height");
          svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

          if (!svg.getAttribute("viewBox")) {
            const width = parseFloat(originalWidth) || 800;
            const height = parseFloat(originalHeight) || 600;
            svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
          }

          svg.classList.add("quadrant-svg");
          svg.style.width = "100%";
          svg.style.height = "100%";
          svg.style.display = "block";

          // Marca todos os rects com ID no formato: visao_area_qN
          svg.querySelectorAll("rect[id]").forEach((el) => {
            const id = el.id;
            // Verifica se o ID tem o formato: visao_area_qN
            if (/^[a-z]+_[a-zA-Z]+_q\d+$/i.test(id)) {
              el.classList.add("quadrant-area");

              // Extrai e armazena os dados no dataset do elemento
              const data = extractQuadrantData(id);
              if (data) {
                el.dataset.visao = data.visao;
                el.dataset.area = data.area;
                el.dataset.numero = data.numero;
              }
            }
          });

          // Seleção inicial se o quadrante correspondente já estiver selecionado
          if (selectedQuadrant) {
            const target = svg.querySelector(
              `#${CSS.escape(selectedQuadrant)}`,
            );
            if (target) target.classList.add("selected");
          }

          setLoaded(true);
        } else {
          throw new Error("Nenhum SVG válido encontrado");
        }
      } catch (err) {
        if (active) {
          console.error("Erro ao carregar célula SVG:", err);
          setError(err.message);
          setLoaded(false);
        }
      }
    };

    loadSVG();

    return () => {
      active = false;
    };
  }, [src]);

  // Efeito para sincronizar as classes de seleção quando o quadrante mudar globalmente
  useEffect(() => {
    const wrapper = cellRef.current;
    if (!wrapper || !loaded) return;

    const svg = wrapper.querySelector("svg");
    if (!svg) return;

    // Limpa seleções antigas desta célula
    svg.querySelectorAll(".selected").forEach((el) => {
      el.classList.remove("selected");
    });

    if (!selectedQuadrant) return;

    // Se o quadrante global selecionado existir nesta célula, destaca ele
    const target = svg.querySelector(`#${CSS.escape(selectedQuadrant)}`);
    if (target) target.classList.add("selected");
  }, [selectedQuadrant, loaded]);

  const handleClick = (e) => {
    const wrapper = cellRef.current;
    if (!wrapper || !loaded) return;

    const clickedEl = e.target.closest(".quadrant-area");

    if (!clickedEl) return;

    // Pega o ID completo do quadrante clicado
    const quadranteId = clickedEl.id;

    // Extrai todos os dados do ID
    const data = extractQuadrantData(quadranteId);

    if (!data) {
      console.warn("Formato de ID não reconhecido:", quadranteId);
      return;
    }

    // Chama o callback com todos os dados extraídos
    onSelectQuadrant({
      id: quadranteId,
      visao: data.visao, // "dx", "sx", "frontal", "traseira"
      visaoNome: data.visaoNome,
      area: data.area, // "portaTraseira", "parachoque", "lateral"
      numero: data.numero, // 1, 2, 3, 4, 5, 6
      displayName: data.displayName,
    });
  };

  return (
    <div className="quadrant-grid__cell">
      {label && <div className="quadrant-grid__cell-label">{label}</div>}
      <div
        className="quadrant-grid__svg-wrapper"
        ref={cellRef}
        onClick={handleClick}
      >
        {!loaded && !error && (
          <div className="quadrant-grid__loading">
            <span>Carregando vista...</span>
          </div>
        )}
        {error && (
          <div className="quadrant-grid__error-inline">
            Erro ao carregar imagem: {error}
          </div>
        )}
      </div>
    </div>
  );
};

const QuadrantGrid = ({ onSelectQuadrant, selectedQuadrant, modelo }) => {
  const src = svgMap[modelo];

  if (!src) {
    return (
      <div className="quadrant-grid">
        <div className="quadrant-grid__card">
          <div className="quadrant-grid__error">
            Modelo "{modelo}" não possui visualizações cadastradas.
          </div>
        </div>
      </div>
    );
  }

  const isMatrix = typeof src === "object" && !Array.isArray(src);

  return (
    <div className="quadrant-grid">
      <div className="quadrant-grid__card">
        {isMatrix ? (
          // Renderização para múltiplos SVGs (Ex: RAM 291 em matriz 2x2)
          <div className="quadrant-grid__matrix">
            <SvgCell
              src={src.sx}
              label="Lado Esquerdo (SX)"
              selectedQuadrant={selectedQuadrant?.id}
              onSelectQuadrant={onSelectQuadrant}
            />
            <SvgCell
              src={src.dx}
              label="Lado Direito (DX)"
              selectedQuadrant={selectedQuadrant?.id}
              onSelectQuadrant={onSelectQuadrant}
            />
            <SvgCell
              src={src.frontal}
              label="Frente (Frontal)"
              selectedQuadrant={selectedQuadrant?.id}
              onSelectQuadrant={onSelectQuadrant}
            />
            <SvgCell
              src={src.traseira}
              label="Traseira"
              selectedQuadrant={selectedQuadrant?.id}
              onSelectQuadrant={onSelectQuadrant}
            />
          </div>
        ) : (
          // Renderização normal para 1 único SVG (Modelos antigos)
          <SvgCell
            src={src}
            selectedQuadrant={selectedQuadrant?.id}
            onSelectQuadrant={onSelectQuadrant}
          />
        )}
      </div>
    </div>
  );
};

export default QuadrantGrid;

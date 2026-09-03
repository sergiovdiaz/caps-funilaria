/**
 * TreeSidebar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Sidebar ESQUERDA expansível com árvore de navegação hierárquica.
 * AGORA COM CONTEXT - sem props drilling!
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { C } from "./data/theme.js";
import { useTreeData } from "./hooks/useTreeData.js";
import { useNavigation } from "./contexts/NavigationContext.jsx";
import { Icon } from "./ui/Icon.jsx";

// ─── Constantes ───────────────────────────────────────────────────────────────
const LEVEL_META = [
  {
    key: "ute",
    label: "UTE",
    icon: <Icon name="ute" size={14} color={C.accent} />,
  },
  {
    key: "linha",
    label: "Linha",
    icon: <Icon name="line" size={16} color={C.accent} />,
  },
  {
    key: "operacao",
    label: "Operação",
    icon: <Icon name="operation" size={16} color={C.accent} />,
  },
  {
    key: "tipoMaquina",
    label: "Tipo de Máq.",
    icon: <Icon name="machineType" size={16} color={C.accent} />,
  },
  {
    key: "maquina",
    label: "Máquina",
    icon: <Icon name="machine" size={16} color={C.accent} />,
  },
  { key: "componentes", label: "Material", icon: "📦" },
];

export const SIDEBAR_COLLAPSED_W = 48;
export const SIDEBAR_EXPANDED_W = 320;
const MAX_INDENT = 40;
const DEBOUNCE_DELAY = 300;

// ─── TreeNode Component ──────────────────────────────────────────────────────
const TreeNode = ({
  node,
  depth,
  path,
  expandedKeys,
  toggleExpand,
  onNavigate,
  highlightText,
  activeKey,
}) => {
  const key = path.join("||");
  const isLeaf = !node.children?.length;
  const isExpanded = expandedKeys.has(key);
  const isActive = activeKey === key;
  const meta = LEVEL_META[depth] ?? LEVEL_META[LEVEL_META.length - 1];
  const label = String(node.label);

  const indentPx = Math.min(depth * 12, MAX_INDENT);

  const renderedLabel = useMemo(() => {
    if (!highlightText) return label;
    const idx = label.toLowerCase().indexOf(highlightText.toLowerCase());
    if (idx === -1) return label;
    return (
      <>
        {label.slice(0, idx)}
        <mark
          style={{
            background: C.amberLo,
            color: C.amber,
            borderRadius: 2,
            padding: "0 1px",
          }}
        >
          {label.slice(idx, idx + highlightText.length)}
        </mark>
        {label.slice(idx + highlightText.length)}
      </>
    );
  }, [label, highlightText]);

  const handleClick = () => {
    // Se NÃO for folha, alterna expansão (ABRE/FECHA)
    if (!isLeaf) {
      toggleExpand(key);
    }

    // SEMPRE navega (mesmo quando fecha)
    onNavigate({
      level: meta.key,
      depth,
      path,
      value: label,
      node,
      originalPath: node.path || path,
      codTipoMaquina: node.codTipoMaquina,
    });
  };

  return (
    <div>
      <div
        data-key={key}
        onClick={handleClick}
        title={label}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: `5px 10px 5px ${8 + indentPx}px`,
          cursor: "pointer",
          borderRadius: 6,
          margin: "1px 4px",
          background: isActive ? C.accentMut : "transparent",
          borderLeft: isActive
            ? `2px solid ${C.accent}`
            : "2px solid transparent",
          transition: "background 0.12s",
          userSelect: "none",
          minWidth: "fit-content",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = C.borderLt;
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = "transparent";
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: C.muted,
            width: 12,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s",
            transform: !isLeaf && isExpanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          {isLeaf ? "●" : "▶"}
        </span>

        <span style={{ fontSize: 12, flexShrink: 0, lineHeight: 1 }}>
          {meta.icon}
        </span>

        <span
          style={{
            fontSize: 12,
            color: isActive ? C.accent : C.textSec,
            fontWeight: isActive ? 600 : 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            lineHeight: 1.35,
          }}
        >
          {renderedLabel}
        </span>

        {!isLeaf && node.children?.length > 0 && (
          <span
            style={{
              fontSize: 9,
              color: C.muted,
              background: C.borderLt,
              borderRadius: 10,
              padding: "1px 5px",
              flexShrink: 0,
            }}
          >
            {node.children.length}
          </span>
        )}
      </div>

      {!isLeaf && isExpanded && node.children?.length > 0 && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode
              key={`${key}||${child.label}||${i}`}
              node={child}
              depth={depth + 1}
              path={[...path, String(child.label)]}
              expandedKeys={expandedKeys}
              toggleExpand={toggleExpand}
              onNavigate={onNavigate}
              highlightText={highlightText}
              activeKey={activeKey}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TreeSidebar Component ───────────────────────────────────────────────────
export const TreeSidebar = ({ isExpanded: externalExpanded, onToggle }) => {
  const { navigateTree, selection } = useNavigation();

  const [internalExpanded, setInternalExpanded] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [search, setSearch] = useState("");
  const [activeKey, setActiveKey] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);
  const treeContainerRef = useRef(null);

  const { treeData, loading, error, searchTree } = useTreeData();

  const [filteredResult, setFilteredResult] = useState({
    filteredTree: [],
    expandedKeys: new Set(),
  });

  const isExpanded =
    externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const handleToggle =
    onToggle || (() => setInternalExpanded(!internalExpanded));

  // Debounce da busca
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_DELAY);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  // Executa a busca
  useEffect(() => {
    if (!searchTree) return;
    if (debouncedSearch.trim()) {
      const result = searchTree(debouncedSearch);
      setFilteredResult(result);
      setExpandedKeys(result.expandedKeys);
    } else {
      setFilteredResult({ filteredTree: treeData, expandedKeys: new Set() });
    }
  }, [debouncedSearch, treeData, searchTree]);

  const displayData = useMemo(() => {
    return search.trim() ? filteredResult.filteredTree : treeData;
  }, [search, filteredResult.filteredTree, treeData]);

  const resultCount = useMemo(() => {
    if (!search.trim()) return null;
    const countNodes = (nodes) => {
      let count = 0;
      for (const node of nodes) {
        count++;
        if (node.children?.length) count += countNodes(node.children);
      }
      return count;
    };
    return countNodes(displayData);
  }, [displayData, search]);

  const toggleExpand = useCallback((key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key); // FECHA se já estiver aberto
      } else {
        next.add(key); // ABRE se estiver fechado
      }
      return next;
    });
  }, []);

  const handleNavigate = useCallback(
    (info) => {
      const key = info.path.join("||");
      setActiveKey(key);
      navigateTree(info.path, info.depth, info.node, info.value);
    },
    [navigateTree],
  );

  //  SINCRONIZAÇÃO CORRIGIDA - PRESERVA TOGGLES MANUAIS DO USUÁRIO
  const syncTreeWithSelection = useCallback(() => {
    if (!treeData.length) return;

    // Constrói o path baseado na seleção atual
    const buildPartialPathFromSelection = () => {
      const path = [];
      if (selection.ute) {
        path.push(String(selection.ute));
        if (selection.linha) {
          path.push(String(selection.linha));
          if (selection.operacao) {
            path.push(String(selection.operacao));
            if (selection.tipoMaquina) {
              const tipoLabel =
                typeof selection.tipoMaquina === "object"
                  ? selection.tipoMaquina.label
                  : selection.tipoMaquina;
              if (tipoLabel) path.push(String(tipoLabel));
              if (selection.maquina) {
                path.push(String(selection.maquina));
              }
            }
          }
        }
      }
      return path;
    };

    const targetPath = buildPartialPathFromSelection();

    // Se não tem seleção, reseta tudo
    if (targetPath.length === 0) {
      // console.log("📭 Sem seleção, resetando árvore");
      setExpandedKeys(new Set());
      setActiveKey(null);
      return;
    }

    // console.log("🔄 Sincronizando árvore - path:", targetPath);

    const requiredExpandedKeys = new Set();
    let foundActiveKey = null;

    // Função recursiva para encontrar e marcar nós
    const traverseAndMark = (nodes, currentPath = [], currentLevel = 0) => {
      for (const node of nodes) {
        const nodeLabel = String(node.label);
        const targetLabel = targetPath[currentLevel];

        const isMatch =
          nodeLabel.toLowerCase().trim() === targetLabel?.toLowerCase().trim();

        if (isMatch) {
          const nodePath = [...currentPath, nodeLabel];
          const nodeKey = nodePath.join("||");

          // ✅ Só força expansão se NÃO for o último nível
          if (currentLevel < targetPath.length - 1) {
            if (node.children?.length > 0) {
              requiredExpandedKeys.add(nodeKey);
            }
          } else {
            foundActiveKey = nodeKey;
          }

          if (node.children?.length && currentLevel < targetPath.length - 1) {
            traverseAndMark(node.children, nodePath, currentLevel + 1);
          }
        }
      }
    };

    traverseAndMark(treeData, [], 0);

    // ✅ CORREÇÃO CRÍTICA: Preserva expansões manuais do usuário
    setExpandedKeys((prev) => {
      const next = new Set(prev);

      // Adiciona as expansões necessárias para mostrar a seleção atual
      requiredExpandedKeys.forEach((key) => {
        next.add(key);
      });

      // ✅ NÃO remove nenhuma expansão existente!
      // O usuário pode ter expandido outros nós manualmente

      return next;
    });

    if (foundActiveKey && activeKey !== foundActiveKey) {
      setActiveKey(foundActiveKey);
    }
  }, [selection, treeData, activeKey]);

  // Executa a sincronização quando selection ou treeData mudar
  useEffect(() => {
    syncTreeWithSelection();
  }, [syncTreeWithSelection]);

  // SCROLL AUTOMÁTICO ATÉ O ITEM SELECIONADO
  useEffect(() => {
    if (activeKey && treeContainerRef.current) {
      setTimeout(() => {
        const activeElement = treeContainerRef.current.querySelector(
          `[data-key="${activeKey}"]`,
        );
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    }
  }, [activeKey]);

  const expandAll = useCallback(() => {
    const collectAllKeys = (nodes, currentPath = [], keys = new Set()) => {
      for (const node of nodes) {
        const path = [...currentPath, String(node.label)];
        const key = path.join("||");
        if (node.children?.length > 0) {
          keys.add(key);
          collectAllKeys(node.children, path, keys);
        }
      }
      return keys;
    };
    const allKeys = collectAllKeys(displayData);
    setExpandedKeys(allKeys);
  }, [displayData]);

  const collapseAll = useCallback(() => {
    setExpandedKeys(new Set());
  }, []);

  const clearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setFilteredResult({ filteredTree: treeData, expandedKeys: new Set() });
    if (searchRef.current) searchRef.current.focus();
  }, [treeData]);

  if (loading) {
    return (
      <div
        style={{
          width: isExpanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W,
          height: "80vh",
          background: C.bg,
          borderRight: `1.5px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "width 0.26s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Icon name="tree" size={20} color={C.accent} />

          <div style={{ fontSize: 12, color: C.muted }}>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: isExpanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W,
        height: "90vh",
        background: C.bg,
        borderRight: `1.5px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.26s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {isExpanded ? (
        <>
          {/* Cabeçalho */}
          <div
            style={{
              padding: "14px 14px 10px",
              borderBottom: `1px solid ${C.borderLt}`,
              flexShrink: 0,
              background: C.bg,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.accent,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="tree" size={15} color={C.accent} />
                Navegação
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={expandAll}
                  title="Expandir tudo"
                  style={btnStyle}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = C.accentMut)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Icon name="expand" size={14} color={C.muted} />
                </button>
                <button
                  onClick={collapseAll}
                  title="Recolher tudo"
                  style={btnStyle}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = C.accentMut)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Icon name="collapse" size={14} color={C.muted} />
                </button>
                <button
                  onClick={handleToggle}
                  title="Recolher sidebar"
                  style={btnStyle}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = C.accentMut)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Icon name="arrowLeft" color={C.muted} />
                </button>
              </div>
            </div>

            {/* Campo de busca */}
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 12,
                  color: C.muted,
                  pointerEvents: "none",
                }}
              >
                <Icon name="search" size={12} color={C.accent} />
              </span>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar máquina, componente..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "7px 28px 7px 28px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  fontSize: 12,
                  color: C.dark,
                  background: C.bg,
                  fontFamily: C.font,
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = C.accent)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
              {search && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: "absolute",
                    right: 7,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.muted,
                    fontSize: 11,
                    padding: 2,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {search && resultCount !== null && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  color: resultCount > 0 ? C.accent : C.muted,
                }}
              >
                {resultCount > 0
                  ? `${resultCount} resultado${resultCount !== 1 ? "s" : ""} encontrado${resultCount !== 1 ? "s" : ""}`
                  : "Nenhum resultado"}
              </div>
            )}
          </div>

          {/* Legenda */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              padding: "8px 12px",
              borderBottom: `1px solid ${C.borderLt}`,
              flexShrink: 0,
            }}
          >
            {LEVEL_META.map((m) => (
              <span
                key={m.key}
                style={{
                  fontSize: 9,
                  color: C.muted,
                  background: C.cardAlt,
                  border: `1px solid ${C.borderLt}`,
                  borderRadius: 4,
                  padding: "1px 5px",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                {m.icon} {m.label}
              </span>
            ))}
          </div>

          {/* Árvore */}
          <div
            ref={treeContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "auto",
              padding: "6px 0 16px",
            }}
          >
            {error ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "red",
                  fontSize: 12,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
                Erro ao carregar árvore
              </div>
            ) : displayData.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: C.muted,
                  fontSize: 12,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>
                  {search ? "🔍" : "🌲"}
                </div>
                {search ? "Nenhum item encontrado" : "Nenhum dado disponível"}
              </div>
            ) : (
              displayData.map((node, i) => (
                <TreeNode
                  key={`${node.label}||${i}`}
                  node={node}
                  depth={0}
                  path={[String(node.label)]}
                  expandedKeys={expandedKeys}
                  toggleExpand={toggleExpand}
                  onNavigate={handleNavigate}
                  highlightText={search}
                  activeKey={activeKey}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <div
          onClick={handleToggle}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            cursor: "pointer",
            gap: 12,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.borderLt)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          {/* <span style={{ fontSize: 24 }}>🌲</span> */}
          <Icon name="tree" size={20} color={C.accent} />
          <span
            style={{
              fontSize: 10,
              color: C.muted,
              writingMode: "vertical-rl",
              letterSpacing: 2,
              fontWeight: 600,
            }}
          >
            MENU
          </span>
          <span style={{ fontSize: 12, color: C.accent }}>▶</span>
        </div>
      )}
    </div>
  );
};

const btnStyle = {
  background: "transparent",
  border: `1px solid ${C.border}`,
  borderRadius: 5,
  width: 28,
  height: 28,
  cursor: "pointer",
  color: C.muted,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  lineHeight: 1,
  fontFamily: C.font,
  transition: "background 0.12s",
};

export default TreeSidebar;

import { useEffect, useState, useCallback } from "react";
import { fetchTree } from "../../../../api/machineledger.http";

export const useTreeData = () => {
  const [treeData, setTreeData] = useState([]);
  const [flatList, setFlatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Normaliza texto (remove acento + lowercase)
  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // ─────────────────────────────────────────
  // Flat list
  // ─────────────────────────────────────────
  // hooks/useTreeData.js - atualize a função buildFlatListFromTree
  const buildFlatListFromTree = useCallback((nodes, depth = 0, path = []) => {
    if (!nodes || !Array.isArray(nodes)) return [];

    let result = [];

    for (const node of nodes) {
      const currentPath = [...path, node.label];
      const pathKey = currentPath.join("||");

      result.push({
        id: node.id || pathKey,
        label: node.label,
        depth,
        path: currentPath,
        pathKey,
        node,
        codTipoMaquina: node.codTipoMaquina, // ← adiciona ao flatList
      });

      if (node.children?.length) {
        result = result.concat(
          buildFlatListFromTree(node.children, depth + 1, currentPath),
        );
      }
    }

    return result;
  }, []);
  // ─────────────────────────────────────────
  // Filtrar árvore
  // ─────────────────────────────────────────
  const filterTreeByPaths = useCallback(
    (nodes, pathsToKeep, currentPath = []) => {
      if (!nodes) return [];

      return nodes.reduce((acc, node) => {
        const nodePath = [...currentPath, node.label];
        const key = nodePath.join("||");

        const children = filterTreeByPaths(
          node.children || [],
          pathsToKeep,
          nodePath,
        );

        if (pathsToKeep.has(key) || children.length > 0) {
          acc.push({ ...node, children });
        }

        return acc;
      }, []);
    },
    [],
  );

  // ─────────────────────────────────────────
  // Expandir filhos
  // ─────────────────────────────────────────
  const addAllChildrenPaths = useCallback(
    (children, parentPath, pathsToKeep, expandedKeys) => {
      if (!children) return;

      for (const child of children) {
        const childPath = [...parentPath, child.label];
        const key = childPath.join("||");

        pathsToKeep.add(key);

        if (parentPath.length > 0) {
          expandedKeys.add(parentPath.join("||"));
        }

        if (child.children?.length) {
          addAllChildrenPaths(
            child.children,
            childPath,
            pathsToKeep,
            expandedKeys,
          );
        }
      }
    },
    [],
  );

  // ─────────────────────────────────────────
  //  Busca (SIMPLIFICADA)
  // ─────────────────────────────────────────
  const searchTree = useCallback(
    (searchTerm) => {
      if (!searchTerm?.trim()) {
        return { filteredTree: treeData, expandedKeys: new Set() };
      }

      const term = normalize(searchTerm);

      const matchedItems = flatList
        .filter((item) => normalize(item.label).includes(term))
        .slice(0, 50); // 🔥 LIMITA RESULTADOS

      if (matchedItems.length === 0) {
        return { filteredTree: [], expandedKeys: new Set() };
      }

      const pathsToKeep = new Set();
      const expandedKeys = new Set();

      for (const item of matchedItems) {
        // ancestrais
        for (let i = 1; i <= item.path.length; i++) {
          const key = item.path.slice(0, i).join("||");
          pathsToKeep.add(key);
          expandedKeys.add(key);
        }

        // filhos
        if (item.node?.children) {
          addAllChildrenPaths(
            item.node.children,
            item.path,
            pathsToKeep,
            expandedKeys,
          );
        }
      }

      const filteredTree = filterTreeByPaths(treeData, pathsToKeep);

      return { filteredTree, expandedKeys };
    },
    [treeData, flatList, filterTreeByPaths, addAllChildrenPaths],
  );

  // ─────────────────────────────────────────
  // Load API
  // ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchTree()
      .then((response) => {
        if (cancelled) return;

        let treePayload = null;

        if (response?.success && response.data) {
          treePayload = response.data.tree || response.data;
        } else if (Array.isArray(response)) {
          treePayload = response;
        }

        if (!Array.isArray(treePayload)) {
          throw new Error("Formato inválido");
        }

        setTreeData(treePayload);
        // console.log(treePayload);

        const flat = buildFlatListFromTree(treePayload);
        setFlatList(flat);

        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => (cancelled = true);
  }, [buildFlatListFromTree]);

  return {
    treeData,
    flatList,
    loading,
    error,
    searchTree,
  };
};

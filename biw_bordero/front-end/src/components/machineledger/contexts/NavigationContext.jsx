// contexts/NavigationContext.jsx
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from "react";

// ─── Ordem canônica dos níveis ───────────────────────────────────────────────
const STEP_ORDER = [
  "ute",
  "linha",
  "operacao",
  "tipoMaquina",
  "maquina",
  "componentes",
];

const stepIndex = (step) => STEP_ORDER.indexOf(step);

// ─── Estado inicial ──────────────────────────────────────────────────────────
const EMPTY_SELECTION = {
  ute: null,
  linha: null,
  operacao: null,
  tipoMaquina: null,
  maquina: null,
  filterComponente: null,
};

const initialState = {
  step: "ute",
  selection: EMPTY_SELECTION,
  path: [],
  isTreeExpanded: true,
  searchQuery: "",
};

// ─── Actions ─────────────────────────────────────────────────────────────────
const ACTIONS = {
  SELECT_LEVEL: "SELECT_LEVEL",
  NAVIGATE_TREE: "NAVIGATE_TREE",
  BREADCRUMB_CLICK: "BREADCRUMB_CLICK",
  SET_SEARCH: "SET_SEARCH",
  TOGGLE_TREE: "TOGGLE_TREE",
  SELECT_COMPONENT: "SELECT_COMPONENT",
  RESET_NAVIGATION: "RESET_NAVIGATION",
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
// ─── Reducer ─────────────────────────────────────────────────────────────────
function navigationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SELECT_LEVEL: {
      const { level, value } = action.payload;
      const idx = stepIndex(level);

      // Mantém seleções anteriores até o nível atual
      const newSelection = { ...EMPTY_SELECTION };
      state.path.slice(0, idx).forEach(({ level: lvl, value: val }) => {
        newSelection[lvl] = val;
      });
      newSelection[level] = value;

      const newPath = [...state.path.slice(0, idx), { level, value }];

      const nextStep = STEP_ORDER[idx + 1] ?? "componentes";

      return {
        ...state,
        selection: newSelection,
        path: newPath,
        step: nextStep,
        searchQuery: "",
      };
    }

    case ACTIONS.NAVIGATE_TREE: {
      const { path: treePath, depth, node, value } = action.payload;
      const levelKeys = ["ute", "linha", "operacao", "tipoMaquina", "maquina"];

      // console.log(
      //   "🎯 NAVIGATE_TREE - depth:",
      //   depth,
      //   "path:",
      //   treePath,
      //   "node:",
      //   node,
      // );

      const newSelection = { ...EMPTY_SELECTION };

      // 🔥 CORREÇÃO: Constrói seleção baseada no path
      treePath.forEach((val, i) => {
        const key = levelKeys[i];
        if (!key) return;

        if (key === "tipoMaquina") {
          newSelection[key] = {
            id: val,
            label: val,
            codTipoMaquina: node?.codTipoMaquina,
          };
        } else {
          newSelection[key] = val;
        }
      });

      // 🔥 IMPORTANTE: Garante que a máquina está setada quando depth é 4
      if (depth === 4 && value) {
        newSelection.maquina = value;
        newSelection.filterComponente = null;
        // console.log("✅ Máquina setada:", value);
      }

      // Se for componente (depth 5)
      if (depth === 5 && value) {
        newSelection.filterComponente = value;
      }

      const newPath = treePath
        .slice(0, Math.min(depth + 1, 5))
        .map((val, i) => ({
          level: levelKeys[i],
          value: val,
          ...(i === 3 && { codTipoMaquina: node?.codTipoMaquina }),
        }));

      let newStep = "componentes";
      if (depth < 4) {
        newStep = STEP_ORDER[Math.min(depth + 1, STEP_ORDER.length - 1)];
      } else if (depth === 4) {
        newStep = "componentes"; // Máquina selecionada, vai para componentes
      } else if (depth === 5) {
        newStep = "componentes"; // Componente selecionado, fica em componentes
      }

      // console.log("📊 Nova seleção após NAVIGATE_TREE:", {
      //   selection: newSelection,
      //   step: newStep,
      //   path: newPath,
      // });

      return {
        ...state,
        selection: newSelection,
        path: newPath,
        step: newStep,
        searchQuery: "",
      };
    }

    case ACTIONS.BREADCRUMB_CLICK: {
      const { targetStep } = action.payload;
      const idx = stepIndex(targetStep);

      const newPath = state.path.slice(0, idx);
      const newSelection = { ...EMPTY_SELECTION };

      newPath.forEach(({ level, value }) => {
        newSelection[level] = value;
      });

      return {
        ...state,
        selection: newSelection,
        path: newPath,
        step: targetStep,
        searchQuery: "",
      };
    }

    case ACTIONS.SELECT_COMPONENT: {
      return {
        ...state,
        selection: {
          ...state.selection,
          filterComponente: action.payload.componentName,
        },
      };
    }

    case ACTIONS.SET_SEARCH:
      return { ...state, searchQuery: action.payload };

    case ACTIONS.TOGGLE_TREE:
      return { ...state, isTreeExpanded: !state.isTreeExpanded };

    case ACTIONS.RESET_NAVIGATION:
      return initialState;

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  // ─── Actions memoizadas ─────────────────────────────────────────────────────
  const actions = useMemo(
    () => ({
      selectLevel: (level, value) =>
        dispatch({ type: ACTIONS.SELECT_LEVEL, payload: { level, value } }),

      navigateTree: (path, depth, node, value) =>
        dispatch({
          type: ACTIONS.NAVIGATE_TREE,
          payload: { path, depth, node, value },
        }),

      breadcrumbClick: (targetStep) =>
        dispatch({ type: ACTIONS.BREADCRUMB_CLICK, payload: { targetStep } }),

      selectComponent: (componentName) =>
        dispatch({
          type: ACTIONS.SELECT_COMPONENT,
          payload: { componentName },
        }),

      setSearchQuery: (query) =>
        dispatch({ type: ACTIONS.SET_SEARCH, payload: query }),

      toggleTree: () => dispatch({ type: ACTIONS.TOGGLE_TREE }),

      resetNavigation: () => dispatch({ type: ACTIONS.RESET_NAVIGATION }),
    }),
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      ...actions,
      stepIndex: stepIndex(state.step),
      stepOrder: STEP_ORDER,
    }),
    [state, actions],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// ─── Hook de uso ─────────────────────────────────────────────────────────────
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};

// ─── Hook de breadcrumbs (usa o contexto) ───────────────────────────────────
export const useBreadcrumbs = () => {
  const { path, step, breadcrumbClick } = useNavigation();

  return useMemo(() => {
    const crumbs = [{ label: "UTEs", onClick: () => breadcrumbClick("ute") }];

    path.forEach((p) => {
      const label = typeof p.value === "object" ? p.value.label : p.value;
      crumbs.push({
        label,
        onClick: () => breadcrumbClick(p.level),
      });
    });

    return crumbs;
  }, [path, breadcrumbClick]);
};

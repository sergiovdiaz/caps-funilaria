import React, { useState, useCallback, useMemo } from "react";
import ItemList from "../components/ItemList";

const Main = () => {
  const [sideBySideOpen, setSideBySideOpen] = useState({
    1: true,
    2: true,
    3: true,
  });

  // Memoriza os grupos para evitar recriação desnecessária
  const groups = useMemo(
    () => ({
      group1: ["LATERAL ESQUERDA", "LATERAL DIREITA"],
      group2: ["TETO", "CAPO", "PARALAMA"],
      group3: ["PORTA MALA", "UTE 3"],
    }),
    []
  );

  const toggleVisibility = useCallback((group) => {
    setSideBySideOpen((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);

  return (
    <div className="main">
      {/* Componentes estáticos primeiro */}
      <ItemList title="CARROCERIA" key="CARROCERIA" />
      <ItemList title="SOTTO GRUPPO" key="SOTTO GRUPPO" />

      {/* Grupos dinâmicos */}
      <div className="main__side-by-side">
        {groups.group1.map((title) => (
          <ItemList
            key={title}
            title={title}
            isSideBySide
            isOpen={sideBySideOpen[1]}
            toggleVisibility={() => toggleVisibility(1)}
          />
        ))}
      </div>

      <ItemList title="PORTAS" key="PORTAS" />

      <div className="main__side-by-side">
        {groups.group3.map((title) => (
          <ItemList
            key={title}
            title={title}
            isSideBySide
            isOpen={sideBySideOpen[3]}
            toggleVisibility={() => toggleVisibility(3)}
          />
        ))}
      </div>

      <div className="main__side-by-side">
        {groups.group2.map((title) => (
          <ItemList
            key={title}
            title={title}
            isSideBySide
            isOpen={sideBySideOpen[2]}
            toggleVisibility={() => toggleVisibility(2)}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(Main);

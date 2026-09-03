import { C } from "./data/theme.js";
import { useEffect, useState } from "react";

import ComponentCard from "./ComponentCard";

import { searchMachineLedger } from "../../../api/machineledger.http";

const SearchResults = ({ query, onSelectMaquina, onAddToCart }) => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query || query.length < 2) return;

    const fetch = async () => {
      try {
        const data = await searchMachineLedger(query);
        setResults(data || []);
      } catch (err) {
        console.error("Erro no search:", err);
        setResults([]);
      }
    };

    fetch();
  }, [query]);
  
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          color: C.muted,
          marginBottom: 16,
          fontFamily: C.font,
        }}
      >
        {results.length} resultado{results.length !== 1 ? "s" : ""} para{" "}
        <strong style={{ color: C.accent }}>"{query}"</strong>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {results.map((item, i) => (
          <div
            key={`${item.codSAP}-${i}`}
            style={{
              background: C.card,
              border: `1px solid ${C.borderLt}`,
              borderRadius: 10,
              padding: "10px 16px 14px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            {/* contexto da peça — clicável para ir à máquina */}
            <div
              onClick={() => onSelectMaquina?.(item)}
              style={{
                fontSize: 11,
                color: C.muted,
                marginBottom: 8,
                fontFamily: C.font,
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  background: C.accentMut,
                  color: C.accent,
                  borderRadius: 4,
                  padding: "1px 7px",
                  fontWeight: 600,
                }}
              >
                {item.linha}
              </span>
              <span>Op. {item.operacao}</span>
              <span style={{ color: C.gray300 }}>·</span>
              <span style={{ fontWeight: 600, color: C.dark }}>
                {item.maquina}
              </span>
              <span style={{ color: C.gray300 }}>·</span>
              <span>{item.descTipoMaquina}</span>
              {/* seta indicando que é clicável */}
              <span
                style={{
                  marginLeft: "auto",
                  color: C.accent,
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: 0.7,
                }}
              >
                Ver máquina →
              </span>
            </div>
            <ComponentCard item={item} />
          </div>
        ))}

        {results.length === 0 && (
          <div
            style={{
              color: C.muted,
              padding: 32,
              textAlign: "center",
              background: C.surface,
              borderRadius: 10,
              border: `1px solid ${C.borderLt}`,
              fontFamily: C.font,
              fontSize: 13,
            }}
          >
            Nenhum componente encontrado para "<strong>{query}</strong>".
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

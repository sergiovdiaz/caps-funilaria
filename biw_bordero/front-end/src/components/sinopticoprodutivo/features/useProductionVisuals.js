import { useEffect, useState } from "react";

export function useProductionVisuals() {
  const [visuals, setVisuals] = useState({});

  useEffect(() => {
    // MOCK — simula resposta da API
    const mockResponse = [
      { area: "PRS", status: "Produzindo", color: "#2ecc71" },
      { area: "PPP", status: "Parado", color: "#e74c3c" },
      { area: "PPA", status: "Setup", color: "#f1c40f" },
      { area: "PPS", status: "Manutenção", color: "#9b59b6" },
      { area: "PLD", status: "Sem produção", color: "#95a5a6" },
    ];

    const mapped = {};
    mockResponse.forEach((item) => {
      mapped[item.area] = {
        color: item.color,
        label: item.status,
      };
    });

    // pequeno delay só pra simular carregamento
    const timer = setTimeout(() => {
      setVisuals(mapped);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return visuals;
}

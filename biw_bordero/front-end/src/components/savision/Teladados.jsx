import React, { useEffect, useState } from "react";
import "./Teladados.css";

const Teladados = () => {
  const [dados, setDados] = useState({ nome: "", idade: "", profissao: "" });

  // Função para carregar JSON
  const carregarDados = async () => {
    try {
      const response = await fetch("/dados.json", { cache: "no-store" });
      if (!response.ok) return;
      const json = await response.json();
      setDados(json);
    } catch (err) {
      console.error("Erro ao carregar dados.json:", err);
    }
  };

  // Carrega dados ao montar o componente e atualiza a cada 3s
  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 3000); // atualiza a cada 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="teladados-container">
      <h2>Informações</h2>
      <form className="teladados-form">
        <label>
          Nome:
          <input type="text" value={dados.nome || ""} readOnly />
        </label>

        <label>
          Idade:
          <input type="number" value={dados.idade || ""} readOnly />
        </label>

        <label>
          Profissão:
          <input type="text" value={dados.profissao || ""} readOnly />
        </label>
      </form>
    </div>
  );
};

export default Teladados;

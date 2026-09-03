import React from "react";
import Table from "../../cap/common/Table";
import "./styles/RelatorioTC.css";
import { useTcRelatorio } from "../hooks/useTcrelatorio";

const RelatorioTC = () => {
  const { data, loading, error } = useTcRelatorio();

  const columns = [
    { key: "grupo_dado", label: "Grupo", sortable: true, filterable: true },
    // { key: "line", label: "Linha", sortable: true, filterable: true },
    {
      key: "linhaestacao",
      label: "LinhaEstação",
      sortable: true,
      filterable: true,
    },
    { key: "maq", label: "Máquina", sortable: true, filterable: true },

    { key: "model", label: "Modelo", sortable: true, filterable: true },
    { key: "minimo", label: "Min", sortable: true },
    { key: "mediana", label: "Mediana", sortable: true },
    { key: "desvio_padrao", label: "Desvio Padrão", sortable: true },
    { key: "media", label: "Média", sortable: true },
    // { key: "maximo", label: "Max", sortable: true },
    { key: "moda", label: "Moda", sortable: true },
    { key: "target", label: "Target", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      formatter: (value) => (
        <span
          className={`generic-table__badge-status generic-table__badge-status--${value === "KO" ? "danger" : "success"}`}
        >
          {value}
        </span>
      ),
    },
  ];

  if (error) return <div className="tc-error">Erro ao carregar dados</div>;

  return (
    <div className="relatorio-tc-container">
      <Table
        title="Relatório Tempo Ciclo"
        isLoading={loading}
        columns={columns}
        data={data}
        itemsPerPage={15}
        initialSortColumn="status"
        initialSortDirection="asc"
      />
    </div>
  );
};

export default RelatorioTC;

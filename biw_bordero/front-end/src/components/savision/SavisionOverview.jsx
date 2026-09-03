import React from "react";
import SavisionBarChart from "./SavisionBarChart";
import "./styles/SavisionOverview.css";

const SavisionOverview = ({ data }) => {
  console.log("data é:", data?.Horaria?.all);
  return (
    <div className="savisionoverview">
      <div className="savisionoverview__charts">
        <SavisionBarChart
          turnos={data?.resumoTurnos?.hoje}
          categories={data?.Horaria?.intervalo}
          series={[
            {
              name: "OK",
              data: data?.Horaria?.ok,
            },
            {
              name: "KO",
              data: data?.Horaria?.ko,
            },
          ]}
          title="Hora a Hora"
        />
        <SavisionBarChart
          turnos={data?.resumoTurnos?.semana_atual}
          categories={data?.DiasDaSemana?.all.dia}
          series={[
            { name: "OK", data: data?.DiasDaSemana?.all.ok },
            { name: "KO", data: data?.DiasDaSemana?.all.ko },
          ]}
          title="Semana atual"
        />
        <SavisionBarChart
          turnos={data?.resumoTurnos?.semanas}
          categories={data?.Semanas?.all.semana}
          series={[
            { name: "OK", data: data?.Semanas?.all.ok },
            { name: "KO", data: data?.Semanas?.all.ko },
          ]}
          title="Semanas"
        />
      </div>
    </div>
  );
};

export default SavisionOverview;

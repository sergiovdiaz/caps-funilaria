import React from "react";
import "./styles/asMainPage.css";
import AndonTela from "./AndonTela";
import ProdHourly from "./ProdHourly";
import ProdLosses from "./ProdLosses";
import LossesTable from "./LossesTable";

const AsMainPage = ({ line, data }) => {
  console.log("Dados recebidos em AsMainPage:", data);
  return (
    <main className="as-main__content">
      <section className="as-main__andon">
        <div className="as-main__andon-screen">
          <AndonTela line={line} data={data?.andon} />
        </div>
      </section>

      <section className="as-main__prod">
        <div className="as-main__prod-hourly">
          <ProdHourly data={data?.hourly?.dados ?? []} />
        </div>

        <div className="as-main__prod-losses">
          <ProdLosses data={data?.general_losses?.dados ?? []} />
        </div>
      </section>

      <section className="as-main__lossestable">
        <LossesTable data={data?.table_losses?.dados ?? []} />
      </section>
    </main>
  );
};

export default AsMainPage;

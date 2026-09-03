import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/sinopticoprodutivo/styles/SinopticoProdutivo.css";
import BiWLayout from "../components/biwlayout/BiWLayout";
import { biwAreas } from "../assets/database/biwAreas";

import { useAllLinestatus } from "../components/sinopticoprodutivo/hooks/useAllLinestatus";

export default function SinopticoProdutivo() {
  const visuals = useAllLinestatus();
  const navigate = useNavigate();

  return (
    <div className="sinoptico-prod">
      <BiWLayout
        areas={biwAreas}
        visuals={visuals}
        onAreaClick={(area) => {
          navigate(`/andon/${area.name}`);
        }}
      />
    </div>
  );
}

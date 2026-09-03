import React from "react";
import { useNavigate } from "react-router-dom";

import "../components/styles/SAVision.css";

const SAVision = ({ setMenuAberto }) => {
  const alternarMenu = () => {
    setMenuAberto((prevState) => !prevState);
  };

  const navigate = useNavigate();

  const abrirCaso = (id) => {
    navigate(`/savision/${id}`);
  };

  return (
    <div className="savision">
      <div className="savision__content">
        <div className="savision__title-container">
          <div className="savision__title">SAVISION</div>
          <div className="savision__subtitle">
            FUNILARIA - STELLANTIS GOIANA
          </div>
        </div>
        <div className="savision__cases">
          <div className="savision__cases-title">CASOS DE USO</div>
          <button
            className="savision___cases-button"
            onClick={() => abrirCaso("puntone")}
          >
            Puntone
          </button>
        </div>
      </div>
    </div>
  );
};

export default SAVision;

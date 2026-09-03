import React from "react";
import Renegade from "../assets/images/modelos/Renegade.png";
import Compass from "../assets/images/modelos/Compass.png";
import Toro from "../assets/images/modelos/Toro.png";
import ToroMCA from "../assets/images/modelos/ToroMCA.png";
import Commander from "../assets/images/modelos/Commander.png";
import Rampage from "../assets/images/modelos/Rampage.png";
import { tcTarget } from "../assets/database/tc";
import "./styles/CycleTimeItem.css";

const MODEL_IMAGES = {
  RENEGADE: Renegade,
  COMPASS: Compass,
  TORO: Toro,
  "TORO MCA": ToroMCA,
  COMMANDER: Commander,
  RAMPAGE: Rampage,
};

const CycleTimeItem = ({ dados, line }) => {
  // console.log("dados: ", dados);

  //  Normalização dos campos (LIVE + REPLAY)
  const rawTimestamp = dados._t ?? dados._timestamp;
  const tc = Number(dados.TCData ?? dados.tcdata);
  const modelName = dados.Model ?? dados.model;

  const timestamp = new Date(rawTimestamp);

  const timestamp_format = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(timestamp);

  const imageSrc =
    modelName === "TORO MCA"
      ? MODEL_IMAGES[modelName]
      : MODEL_IMAGES[modelName?.split(" ")[0]];

  const target = Number(tcTarget[line] || tcTarget["default"]);
  const isTcGreaterThanTarget = tc > target ? "red" : "blue";

  return (
    <div className="cycletimeitem">
      <p className={`cycletimeitem-tc ${isTcGreaterThanTarget}`}>{tc}</p>

      {imageSrc && (
        <img
          className="cycletimeitem-img"
          src={imageSrc}
          alt={`Modelo ${modelName}`}
        />
      )}

      <hr className="cycletimeitem-road" />

      <p className="cycletimeitem-model">{modelName}</p>
      <p className="cycletimeitem-time">{timestamp_format}</p>
    </div>
  );
};

export default CycleTimeItem;

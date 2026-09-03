import { useEffect, useState } from "react";
import {
  subscribeSinopticoAndon,
  unsubscribeSinopticoAndon,
  onSinopticoAndonData,
  offSinopticoAndonData,
} from "../../../../api/sinopticoAndon";
import { biwAreas } from "../../../assets/database/biwAreas";

export function useAllLinestatus() {
  const [visuals, setVisuals] = useState({});

  useEffect(() => {
    const lines = biwAreas.filter((a) => a.sinoptico).map((a) => a.id);

    // 🔹 Inscreve todas
    lines.forEach((line) =>
      subscribeSinopticoAndon({ view: "linestatus", line }),
    );

    const handleUpdate = (msg) => {
      if (msg.view !== "linestatus") return;

      const line = msg.line;
      const lineData = msg.payload?.line;
      if (!lineData) return;

      setVisuals((prev) => ({
        ...prev,
        [line]: {
          color: lineData.color_hex,
          label: lineData.andondesc,
        },
      }));
    };

    onSinopticoAndonData(handleUpdate);

    return () => {
      lines.forEach((line) =>
        unsubscribeSinopticoAndon({ view: "linestatus", line }),
      );
      offSinopticoAndonData(handleUpdate);
    };
  }, []);

  return visuals;
}

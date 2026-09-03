//useSinopticoAndon.js
import { useEffect, useState } from "react";
import {
  subscribeSinopticoAndon,
  unsubscribeSinopticoAndon,
  onSinopticoAndonData,
  offSinopticoAndonData,
} from "../../../../api/sinopticoAndon";

export function useSinopticoAndon(line, view) {
  const [data, setData] = useState(null);

  useEffect(() => {
    subscribeSinopticoAndon({ view, line });

    const handleUpdate = (msg) => {
      if (!msg || !msg.type) return;
      if (msg.line !== line) return;
      if (msg.view !== view) return;

      // console.log("Mensagem:", msg);

      // 🔹 SNAPSHOT
      if (msg.type === "SNAPSHOT") {
        setData(msg.payload.data ?? msg.payload);
        return;
      }
      // console.log(msg);

      // 🔹 UPDATE
      if (msg.type === "UPDATE") {
        // Se não for station → substitui tudo
        if (view !== "station") {
          setData(msg.payload.data ?? msg.payload);
          return;
        }

        //  Station → merge parcial
        setData((prev) => {
          if (!prev) return prev;

          const updates = msg.payload.data; //  array de STs atualizadas

          const newData = prev.map((station) => {
            const updated = updates.find((u) => u.st === station.st);
            return updated ? { ...station, ...updated } : station;
          });

          return newData;
        });
      }
    };

    onSinopticoAndonData(handleUpdate);

    return () => {
      offSinopticoAndonData(handleUpdate);
      unsubscribeSinopticoAndon({ view, line });
    };
  }, [line, view]);

  return data;
}

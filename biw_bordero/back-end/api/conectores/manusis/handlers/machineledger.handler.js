// machineledger.handlerconector.js
import { manusisRequest } from "../manusis.connector.js";
import { createReserva, getReservaStatus } from "../reserva/manusis.reserva.js";

export async function getMaterialByCode(materialCodes, page = 1, limit = 100) {
  try {
    const url = "/api/v1/materials";

    //  Mantendo o operador IN como no Python
    const filters = [
      {
        id: "filter",
        property: "code",
        value: materialCodes, // pode ser string ou array de códigos
        anyMatch: false,
        joins: null,
        operator: "IN",
      },
    ];

    const params = {
      _dc: Date.now(),
      serializer_type: "grid",
      page,
      start: (page - 1) * limit,
      limit,
      filter: JSON.stringify(filters),
    };

    //  manusisRequest usa o cliente com cookies + token
    const data = await manusisRequest("GET", url, null, { params });

    // console.log("✅ Resultado material:", data);
    return data;
  } catch (err) {
    console.error(
      `❌ Erro ao buscar material ${materialCodes}:`,
      err.response?.data || err.message,
    );
    throw err;
  }
}


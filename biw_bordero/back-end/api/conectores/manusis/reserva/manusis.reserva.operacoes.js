// usecases/machineledger/manusis.operations.js
import { manusisRequest } from "../manusis.connector.js";

export async function buscarAssetPorCodigo(
  codigoMaquina,
  companyId = 2,
  areaId = 7,
) {
  const filters = [
    { property: "asset_type_id", value: 1, operator: null },
    { property: "is_default_asset", value: false, operator: null },
    { property: "assets.area_id", value: areaId, operator: null },
    { property: "assets.company_id", value: companyId, operator: null },
  ];

  const params = {
    _dc: Date.now(),
    serializer_type: "combo",
    "query[code,description]": codigoMaquina,
    page: 1,
    start: 0,
    limit: 10,
    filter: JSON.stringify(filters),
  };

  try {
    const data = await manusisRequest("GET", "/api/v1/assets", null, {
      params,
    });

    if (data?.meta?.success && data?.data?.length > 0) {
      const asset = data.data[0];
      return {
        success: true,
        asset,
        locations: {
          first_loc_id: asset.first_loc_id,
          second_loc_id: asset.second_loc_id,
          third_loc_id: asset.third_loc_id,
          fourth_loc_id: asset.fourth_loc_id,
        },
      };
    }

    return {
      success: false,
      message: `Ativo não encontrado: ${codigoMaquina}`,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function criarOrdemManutencao({
  assetId,
  description,
  companyId,
  areaId,
  locations,
  maintServiceTypeId = 15,
  maintServiceNatureId = 58,
}) {
  const now = new Date();
  const nowBrt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const scheduledTo = new Date(nowBrt.getTime() + 60000);
  const estFinishAt = new Date(nowBrt.getTime() + 300000);

  const ordemData = {
    is_readonly: false,
    data_custom_form: "{}",
    id: null,
    order_number: "",
    company_id: companyId,
    area_id: areaId,
    first_loc_id: locations.first_loc_id,
    second_loc_id: locations.second_loc_id,
    third_loc_id: locations.third_loc_id,
    fourth_loc_id: locations.fourth_loc_id,
    asset_id: assetId,
    description,
    maint_service_type_id: maintServiceTypeId,
    maint_service_nature_id: maintServiceNatureId,
    opened_at: formatDateManusis(nowBrt),
    scheduled_to: formatDateManusis(scheduledTo),
    est_finish_at: formatDateManusis(estFinishAt),
    is_maintenance_necessary: true,
    need_asset_stop: false,
    is_failure_analysis: false,
    is_approved: false,
  };

  try {
    const data = await manusisRequest(
      "POST",
      "/api/v1/maint_orders",
      ordemData,
    );

    if (data?.meta?.success && data?.data) {
      return {
        success: true,
        orderId: data.data.id,
        orderNumber: data.data.order_number,
      };
    }

    return { success: false, message: "Erro ao criar ordem" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function criarAtividadeOrdem({ maintOrderId, task, number = 1 }) {
  const atividadeData = {
    is_readonly: false,
    number,
    task,
    need_asset_stop: false,
    maint_order_id: maintOrderId,
    is_measurements_completed: true,
    has_maint_punch_list: false,
  };

  try {
    const data = await manusisRequest(
      "POST",
      "/api/v1/maint_order_activities?lang=pt_BR",
      atividadeData,
    );

    if (data?.meta?.success && data?.data) {
      return {
        success: true,
        activityId: data.data.id,
      };
    }

    return { success: false, message: "Erro ao criar atividade" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function criarReservaMaterial({
  maintOrderId,
  materialId,
  quantity,
  maintOrderActivityId,
  warehouseId = 108,
}) {
  const reservaData = {
    is_readonly: false,
    data_custom_form: "{}",
    id: null,
    maint_order_id: maintOrderId,
    material_id: materialId,
    quantity,
    create_material_reservation: true,
    warehouse_id: warehouseId,
    maint_order_activity_id: maintOrderActivityId,
  };

  try {
    const data = await manusisRequest(
      "POST",
      "/api/v1/maint_order_est_materials_usages",
      reservaData,
    );

    if (data?.meta?.success && data?.data) {
      return {
        success: true,
        reservationId: data.data.id,
        reservationNumber: data.data.material_reservation_number,
      };
    }

    return { success: false, message: "Erro ao criar reserva" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function consultarReservaPorId(reservationId, maintOrderId) {
  const filters = [
    {
      property: "maint_order_id",
      value: maintOrderId,
      operator: "=",
    },
  ];

  const params = {
    _dc: Date.now(),
    serializer_type: "grid",
    page: 1,
    start: 0,
    limit: 100,
    filter: JSON.stringify(filters),
  };

  try {
    const data = await manusisRequest(
      "GET",
      "/api/v1/maint_order_est_materials_usages/prediction_vs_used",
      null,
      { params },
    );

    if (data?.meta?.success && data?.data) {
      const reserva = data.data.find((r) => r.id === parseInt(reservationId));

      if (reserva) {
        const reservationNumber = reserva.material_reservation_number || "";
        return {
          success: true,
          reservation: reserva,
          reservationNumber,
          hasDash: reservationNumber.includes("-"),
          isIntegrated: reservationNumber.includes("-"),
        };
      }
    }

    return {
      success: false,
      message: `Reserva ${reservationId} não encontrada`,
      hasDash: false,
      isIntegrated: false,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      hasDash: false,
      isIntegrated: false,
    };
  }
}

function formatDateManusis(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-0300`;
}

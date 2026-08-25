import {
  AttentionStatus,
  OrderDeliveryPaginatedItem,
} from "@/services/orderDeliveryService";

/**
 * La columna de fecha de los listados de órdenes cambia de significado según la
 * pestaña: en "Por atender" interesa cuándo la registró el proveedor, y en
 * "Atendidas" cuándo la tomó el mostrador.
 *
 * En "Todas" conviven las dos, así que se muestra la más reciente de las dos
 * junto con `kind`, para que la fila pueda aclarar de cuál está hablando.
 */
export const ATTENTION_DATE_HEADERS: Record<AttentionStatus, string> = {
  Unattended: "Creada el",
  Attended: "Atendida el",
  All: "Fecha",
};

export type AttentionDate = {
  at: string;
  kind: "created" | "attended";
};

export function attentionDate(
  order: Pick<OrderDeliveryPaginatedItem, "createdAt" | "attendedAt">,
  status: AttentionStatus
): AttentionDate {
  // `attendedAt` viene poblado exactamente cuando la orden está atendida, pero
  // se comprueba igual: una orden atendida antes de que el backend expusiera el
  // campo llegaría sin él y la celda quedaría vacía.
  if (status !== "Unattended" && order.attendedAt) {
    return { at: order.attendedAt, kind: "attended" };
  }
  return { at: order.createdAt, kind: "created" };
}

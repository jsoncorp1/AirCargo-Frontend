/**
 * ¿La orden la creó este usuario?
 *
 * Sirve para ocultar Editar y Eliminar sobre órdenes ajenas. **No es una
 * medida de seguridad**: quien quiera saltearla le pega al endpoint directo.
 * La validación real vive en el backend; esto solo evita ofrecer un botón que
 * va a rebotar.
 *
 * Mientras el backend no mande `createdBy` en el listado no hay con qué
 * comparar, y se devuelve `true` para no esconder acciones que hoy funcionan.
 * Cuando el campo llegue, el filtrado se activa solo.
 */
export function isOrderOwner(
  order: { createdBy?: string | null },
  userEmail?: string | null
): boolean {
  if (!order.createdBy || !userEmail) return true;
  // Los correos no distinguen mayúsculas en la práctica, y el que guarda el
  // backend puede no coincidir en capitalización con el del login.
  return order.createdBy.trim().toLowerCase() === userEmail.trim().toLowerCase();
}

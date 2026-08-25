// Mensajes amigables para las claves de error (`title` del ProblemDetails) que
// devuelve el backend en los errores de permisos/scoping por rol.
// El 403 del middleware de roles llega SIN body; ese caso lo cubre apiClient
// con FORBIDDEN_FALLBACK_MESSAGE.

export const FORBIDDEN_FALLBACK_MESSAGE =
  'No tienes permisos para realizar esta acción.';

// 409: dos operaciones tocaron el mismo artículo a la vez y la segunda se
// rechazó. No se guardó nada — ni la orden, ni el detalle, ni el descuento de
// stock —, así que reintentar la operación completa es seguro.
export const CONCURRENCY_CONFLICT_ERROR_KEY = 'concurrency.conflict';

export const CONCURRENCY_CONFLICT_MESSAGE =
  'Otra operación modificó el stock de un artículo mientras se guardaba esta. ' +
  'No se guardó ningún cambio; vuelve a intentarlo.';

// 429: el formulario público de contacto está limitado por IP (10 requests cada
// 10 minutos, contando también los rechazados por validación).
export const RATE_LIMIT_ERROR_KEY = 'lead.ratelimit.exceeded';

export const API_ERROR_MESSAGES: Record<string, string> = {
  // Conflicto de concurrencia sobre el stock (409).
  [CONCURRENCY_CONFLICT_ERROR_KEY]: CONCURRENCY_CONFLICT_MESSAGE,

  // Recurso fuera del alcance del usuario (proveedor/sucursal).
  'article.access.forbidden': 'El artículo no pertenece a tu proveedor.',
  'articlereceipt.access.forbidden': 'La recepción no pertenece a tu proveedor.',
  'orderdelivery.access.forbidden': 'La orden de entrega no pertenece a tu proveedor.',
  // Editar y eliminar quedan reservados a quien creó la orden, aunque otro
  // usuario del mismo proveedor la vea en su listado. Cubre la carrera: dos
  // pestañas abiertas, o el listado sin refrescar desde antes de la regla.
  'orderdelivery.edit.notowner':
    'Solo quien creó esta orden puede modificarla.',
  'orderdelivery.delete.notowner':
    'Solo quien creó esta orden puede eliminarla.',
  // Para el conductor esto significa además "el envío no está asignado a vos":
  // desde el reparto por asignaciones, el conductor solo ve lo que le tocó.
  'shipment.access.forbidden':
    'Este envío no está a tu alcance: no pertenece a tu proveedor ni a tu sucursal, o no te fue asignado.',
  'user.access.forbidden': 'Solo puedes gestionar conductores de tu sucursal.',
  'shipment.statuschange.forbidden':
    'No puedes cambiar el estado de un envío de otra sucursal.',
  'shipment.orderdelivery.forbidden':
    'Esta orden es de otro departamento; solo puede atenderla un admin de ese departamento.',

  // Restricciones del admin al gestionar usuarios.
  'user.role.forbidden': 'Como admin solo puedes crear usuarios con rol conductor.',
  'user.branchoffice.forbidden':
    'Como admin solo puedes asignar conductores a tu propia sucursal.',

  // Usuario autenticado sin proveedor/sucursal asignada. El backend eliminó los
  // equivalentes de artículos, recepciones y envíos (estado que la BD ya impide);
  // estos dos siguen existiendo.
  'orderdelivery.user.notsupplier': 'Tu usuario no tiene un proveedor asignado.',
  'user.actor.nobranch': 'Tu usuario no tiene una sucursal asignada.',

  // Sucursal de origen al crear envíos. El superadmin no tiene sucursal propia:
  // debe indicar desde cuál está atendiendo.
  'shipment.originbranch.required':
    'Debes indicar desde qué sucursal se está registrando el envío.',
  'shipment.originbranch.notfound': 'La sucursal de origen indicada no existe.',
  'shipment.originbranch.missing':
    'Tu rol no puede atender mostrador, por lo que no se puede determinar el origen del envío.',
  'sporadicshipment.originbranch.required':
    'Debes indicar desde qué sucursal se está registrando el envío.',
  'sporadicshipment.originbranch.notfound': 'La sucursal de origen indicada no existe.',
  'sporadicshipment.originbranch.missing':
    'Tu rol no puede atender mostrador, por lo que no se puede determinar el origen del envío.',

  // Sucursal de DESTINO. Va en la orden como indicación de quien la creó, y el
  // backend valida que sea coherente con el departamento declarado en vez de
  // corregir uno de los dos en silencio.
  'branchoffice.department.invalid':
    'El departamento indicado para filtrar sucursales no es válido.',
  'orderdelivery.destinationbranch.notfound':
    'La sucursal de destino indicada no existe o fue dada de baja.',
  'orderdelivery.destinationbranch.mismatch':
    'La sucursal de destino no pertenece al departamento de destino de la orden.',
  'sporadicshipment.destinationbranch.notfound':
    'La sucursal de destino indicada no existe o fue dada de baja.',
  'sporadicshipment.destinationbranch.mismatch':
    'La sucursal de destino no pertenece al departamento de destino del envío.',

  // Coherencia rol ↔ proveedor/sucursal al crear/editar usuarios.
  'user.scope.notallowed': 'El rol superadmin no puede tener proveedor ni sucursal asignada.',
  'user.role.scopeundefined':
    'Este rol no tiene definido su ámbito (proveedor o sucursal); no se puede asignar.',
  'user.supplierid.required': 'El rol usuarioempresa requiere un proveedor asignado.',
  'user.supplierid.notallowed': 'Este rol no puede tener un proveedor asignado.',
  'user.branchofficeid.required': 'Este rol requiere una sucursal asignada.',
  'user.branchofficeid.notallowed': 'El rol usuarioempresa no puede tener sucursal asignada.',

  // Reglas de negocio de envíos y órdenes.
  'shipment.statuschange.empty': 'Debes indicar un estado, una observación o un comentario.',
  'shipment.statuschange.conflict': 'No se puede mandar estado y observación a la vez.',
  'shipment.statuschange.invalidtransition': 'La transición de estado no está permitida.',
  'shipment.observation.invalidstatus':
    'Solo se puede observar un envío en estado "En tránsito" u "Observado".',
  'shipment.alreadyattended': 'Este envío ya fue atendido.',
  'shipment.daterange.invalid': 'La fecha "desde" no puede ser mayor que la fecha "hasta".',
  'orderdelivery.alreadyattended': 'Esta orden de entrega ya fue atendida.',
  'orderdelivery.daterange.invalid':
    'La fecha "desde" no puede ser mayor que la fecha "hasta".',
  'orderdelivery.stock.insufficient':
    'No hay stock suficiente para uno de los artículos. El stock sube con las recepciones.',

  // ─── Manifiestos ───────────────────────────────────────────────────────────
  // El lote de transporte entre dos sucursales. El admin solo opera sobre los
  // que pasan por la suya.
  'manifest.notfound': 'El manifiesto no existe.',
  'manifest.access.forbidden': 'Este manifiesto no sale ni llega a tu sucursal.',
  'manifest.originbranch.required':
    'Debes indicar desde qué sucursal sale el manifiesto.',
  'manifest.originbranch.notfound': 'La sucursal de origen indicada no existe.',
  'manifest.originbranch.missing':
    'Tu usuario no tiene una sucursal asignada, por lo que no puede armar manifiestos.',
  'manifest.destinationbranch.notfound': 'La sucursal de destino indicada no existe.',
  'manifest.branches.same':
    'El origen y el destino no pueden ser la misma sucursal. Un envío local no viaja en manifiesto.',
  'manifest.shipments.required': 'Debes seleccionar al menos un envío.',
  'manifest.shipments.locked':
    'El manifiesto ya no está abierto: no se le pueden agregar ni quitar envíos.',
  'manifest.shipment.notfound': 'Alguno de los envíos no existe o no pertenece a este manifiesto.',
  'manifest.shipment.alreadymanifested':
    'Alguno de los envíos ya está en otro manifiesto. No se agregó ninguno.',
  'manifest.shipment.invalidstatus':
    'Alguno de los envíos no está esperando en la sucursal de origen. No se agregó ninguno.',
  'manifest.shipment.routemismatch':
    'Alguno de los envíos no hace el mismo trayecto que el manifiesto. No se agregó ninguno.',
  'manifest.shipment.invalidtransition':
    'Alguno de los envíos del lote no admite este cambio de estado.',
  'manifest.statuschange.invalidtransition':
    'La transición de estado del manifiesto no está permitida.',
  'manifest.dispatch.empty': 'No se puede despachar un manifiesto sin envíos.',
  'manifest.delete.locked':
    'Solo se puede eliminar un manifiesto abierto. Si ya salió, anúlalo en vez de borrarlo.',
  'manifest.daterange.invalid': 'La fecha "desde" no puede ser mayor que la fecha "hasta".',

  // ─── Asignaciones a conductores ────────────────────────────────────────────
  'assignment.notfound': 'La asignación no existe.',
  'assignment.access.forbidden':
    'Esta asignación no es tuya ni pertenece a tu sucursal.',
  'assignment.driver.notfound': 'El conductor indicado no existe.',
  'assignment.driver.notdriver': 'El usuario indicado no tiene rol conductor.',
  'assignment.driver.nobranch': 'El conductor no tiene una sucursal asignada.',
  'assignment.shipments.required': 'Debes seleccionar al menos un envío.',
  'assignment.shipment.notfound': 'Alguno de los envíos no existe.',
  'assignment.shipment.invalidstatus':
    'Alguno de los envíos no está listo para repartirse. No se asignó ninguno.',
  'assignment.shipment.branchmismatch':
    'Alguno de los envíos no llegó a la sucursal del conductor. No se asignó ninguno.',
  'assignment.shipment.alreadyassigned':
    'Alguno de los envíos ya tiene un reparto en curso. No se asignó ninguno.',
  'assignment.shipment.invalidtransition': 'El envío no admite este cambio de estado.',
  'assignment.statuschange.invalidtransition':
    'La transición de estado de la asignación no está permitida.',
  'assignment.observation.required':
    'Para registrar una entrega fallida debes indicar el motivo.',
  'assignment.observation.invalidstatus':
    'Solo se puede observar un envío que ya está en la calle. Marca primero el recojo.',
  'assignment.photos.required':
    'Para registrar la entrega debes adjuntar al menos una foto.',
  // Las fotos las sube el backend al servicio de imágenes. En estos errores el
  // `detail` trae el dato concreto (qué archivo, cuántas fotos van); estos
  // mensajes son el respaldo genérico. Ver `getPhotoErrorMessage`.
  'assignment.photos.toomany': 'Un reparto admite hasta 3 fotos.',
  'assignment.photos.invalidtype': 'Solo se aceptan fotos JPG, PNG o WEBP.',
  'assignment.photos.empty': 'Una de las fotos llegó vacía. Vuelve a sacarla.',
  'assignment.photos.toolarge':
    'Alguna foto pesa más de 10 MB. Comprímela antes de subirla.',
  'assignment.photos.closed':
    'Este reparto ya está cerrado: no admite más fotos.',
  'image.upload.failed':
    'No se pudo subir la foto al servidor de imágenes. Vuelve a intentarlo.',
  'assignment.daterange.invalid': 'La fecha "desde" no puede ser mayor que la fecha "hasta".',

  // ─── Clientes potenciales (leads) ──────────────────────────────────────────
  // El formulario de contacto es público, así que los mensajes de validación
  // los puede llegar a leer un visitante: van sin jerga interna.
  'lead.notfound': 'El cliente potencial no existe.',
  'lead.access.forbidden': 'Este cliente potencial es de otro departamento.',
  'lead.companyname.required': 'Falta el nombre de la compañía.',
  'lead.companyaddress.required': 'Falta la dirección de la compañía.',
  'lead.city.required': 'Falta la ciudad.',
  'lead.city.invalid': 'La ciudad indicada no es válida.',
  'lead.contactfullname.required': 'Falta el nombre de la persona de contacto.',
  'lead.contactemail.required': 'Falta el correo electrónico.',
  'lead.contactemail.invalid': 'El correo electrónico no tiene un formato válido.',
  'lead.contactphone.required': 'Falta el teléfono.',
  'lead.comments.toolong': 'Los comentarios superan los 200 caracteres.',
  'lead.statuschange.invalidtransition':
    'Ese cambio de estado no está permitido. Un cliente potencial cerrado no se reabre.',
  'lead.status.required': 'Debes indicar el nuevo estado.',
  'lead.status.invalid': 'El estado indicado no es válido.',
  'lead.internalnote.toolong': 'La nota interna supera los 500 caracteres.',
  'lead.daterange.invalid': 'La fecha "desde" no puede ser mayor que la fecha "hasta".',
  // 429, no 400: el backend devuelve Too Many Requests con `Retry-After`.
  [RATE_LIMIT_ERROR_KEY]:
    'Recibimos demasiadas solicitudes desde tu conexión. Espera unos minutos y vuelve a intentarlo.',
  // Estas solo aparecen si el `maxLength` del input falla o alguien postea a mano.
  'lead.companyname.toolong': 'El nombre de la compañía supera los 150 caracteres.',
  'lead.companyaddress.toolong': 'La dirección supera los 200 caracteres.',
  'lead.country.toolong': 'El país supera los 60 caracteres.',
  'lead.contactfullname.toolong': 'El nombre de contacto supera los 150 caracteres.',
  'lead.contactemail.toolong': 'El correo supera los 150 caracteres.',
  'lead.contactphone.toolong': 'El teléfono supera los 30 caracteres.',

  // Token huérfano: el usuario autenticado ya no existe en BD.
  'article.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'articlereceipt.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'orderdelivery.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'shipment.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'manifest.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'assignment.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  // Llega como 400 y no como 404, pero significa lo mismo: token huérfano.
  'lead.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'user.actor.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
};

// Claves 404 que indican que el usuario del token ya no existe (BD reseteada o
// usuario eliminado): hay que cerrar sesión y volver a loguearse.
export const ORPHAN_TOKEN_ERROR_KEYS = new Set([
  'article.user.notfound',
  'articlereceipt.user.notfound',
  'orderdelivery.user.notfound',
  'shipment.user.notfound',
  'manifest.user.notfound',
  'assignment.user.notfound',
  'lead.user.notfound',
  'user.actor.notfound',
]);

// Forma del error que lanza apiClient. No es una `Error`, así que un
// `err instanceof Error` nunca acierta: hay que leerlo con estos helpers.
export interface ApiError {
  status: number;
  message: string;
  errorKey?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  // Solo en un 429: segundos que pide esperar la cabecera `Retry-After`.
  retryAfterSeconds?: number;
}

export function isApiError(err: unknown): err is ApiError {
  return (
    !!err &&
    typeof err === 'object' &&
    typeof (err as ApiError).status === 'number' &&
    'message' in (err as object)
  );
}

/**
 * `true` cuando el backend rechazó la operación por un choque de concurrencia
 * sobre el stock. No hay estado parcial que limpiar: se puede reintentar la
 * operación completa sin riesgo de duplicar.
 */
export function isConcurrencyConflict(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return err.status === 409 || err.errorKey === CONCURRENCY_CONFLICT_ERROR_KEY;
}

/**
 * `true` cuando el backend cortó por rate limit (429). Solo lo puede disparar el
 * formulario público de contacto.
 */
export function isRateLimited(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return err.status === 429 || err.errorKey === RATE_LIMIT_ERROR_KEY;
}

/**
 * Mensaje del 429 con el tiempo de espera concreto cuando el backend lo manda.
 * Sin `Retry-After` cae en el genérico de "espera unos minutos".
 */
export function getRateLimitMessage(err: unknown): string {
  const generic = API_ERROR_MESSAGES[RATE_LIMIT_ERROR_KEY];
  if (!isApiError(err) || !err.retryAfterSeconds) return generic;
  const minutes = Math.ceil(err.retryAfterSeconds / 60);
  return (
    'Recibimos demasiadas solicitudes desde tu conexión. ' +
    `Vuelve a intentarlo en ${minutes} minuto${minutes === 1 ? '' : 's'}.`
  );
}

/**
 * Mensaje legible de cualquier error que venga de la API. Sirve tanto para el
 * error de apiClient (objeto plano) como para una `Error` normal.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isConcurrencyConflict(err)) return CONCURRENCY_CONFLICT_MESSAGE;
  if (isRateLimited(err)) return getRateLimitMessage(err);

  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      // apiClient ya traduce por clave, pero los componentes que reciben la
      // clave cruda (o un mensaje del backend) siguen pudiendo mapearla acá.
      return API_ERROR_MESSAGES[msg] ?? msg;
    }
  }
  return fallback;
}

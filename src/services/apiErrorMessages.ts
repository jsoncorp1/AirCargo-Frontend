// Mensajes amigables para las claves de error (`title` del ProblemDetails) que
// devuelve el backend en los errores de permisos/scoping por rol.
// El 403 del middleware de roles llega SIN body; ese caso lo cubre apiClient
// con FORBIDDEN_FALLBACK_MESSAGE.

export const FORBIDDEN_FALLBACK_MESSAGE =
  'No tienes permisos para realizar esta acción.';

export const API_ERROR_MESSAGES: Record<string, string> = {
  // Recurso fuera del alcance del usuario (proveedor/sucursal).
  'article.access.forbidden': 'El artículo no pertenece a tu proveedor.',
  'articlereceipt.access.forbidden': 'La recepción no pertenece a tu proveedor.',
  'orderdelivery.access.forbidden': 'La orden de entrega no pertenece a tu proveedor.',
  'shipment.access.forbidden': 'El envío no pertenece a tu proveedor o sucursal.',
  'user.access.forbidden': 'Solo puedes gestionar conductores de tu sucursal.',
  'shipment.statuschange.forbidden':
    'No puedes cambiar el estado de un envío de otra sucursal.',
  'shipment.orderdelivery.forbidden':
    'Esta orden es de otro departamento; solo puede atenderla un admin de ese departamento.',

  // Restricciones del admin al gestionar usuarios.
  'user.role.forbidden': 'Como admin solo puedes crear usuarios con rol conductor.',
  'user.branchoffice.forbidden':
    'Como admin solo puedes asignar conductores a tu propia sucursal.',

  // Usuario autenticado sin proveedor/sucursal asignada.
  'article.user.notsupplier': 'Tu usuario no tiene un proveedor asignado.',
  'articlereceipt.user.notsupplier': 'Tu usuario no tiene un proveedor asignado.',
  'orderdelivery.user.notsupplier': 'Tu usuario no tiene un proveedor asignado.',
  'shipment.user.notsupplier': 'Tu usuario no tiene un proveedor asignado.',
  'orderdelivery.user.nobranch': 'Tu usuario no tiene una sucursal asignada.',
  'shipment.user.nobranch': 'Tu usuario no tiene una sucursal asignada.',
  'user.actor.nobranch': 'Tu usuario no tiene una sucursal asignada.',
  'shipment.originbranch.missing':
    'Tu usuario no tiene una sucursal asignada, por lo que no se puede calcular el origen del envío.',

  // Coherencia rol ↔ proveedor/sucursal al crear/editar usuarios.
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
  'orderdelivery.stock.insufficient':
    'No hay stock suficiente para uno de los artículos. El stock sube con las recepciones.',

  // Token huérfano: el usuario autenticado ya no existe en BD.
  'article.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'articlereceipt.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'orderdelivery.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'shipment.user.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
  'user.actor.notfound': 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
};

// Claves 404 que indican que el usuario del token ya no existe (BD reseteada o
// usuario eliminado): hay que cerrar sesión y volver a loguearse.
export const ORPHAN_TOKEN_ERROR_KEYS = new Set([
  'article.user.notfound',
  'articlereceipt.user.notfound',
  'orderdelivery.user.notfound',
  'shipment.user.notfound',
  'user.actor.notfound',
]);

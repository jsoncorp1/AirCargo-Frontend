# AirCargo — Órdenes: la validación de autor tiene que estar en el backend

Pedido del **frontend al backend**. Es corto y es uno solo.

La mitad visual ya está resuelta: el front oculta **Editar** y **Eliminar** sobre
las órdenes de otro usuario del mismo proveedor, y funciona —lo probamos con dos
usuarios de Viralshop—.

**Pero eso no protege nada.** Ocultar un botón es una cortesía de interfaz, no
una barrera. Falta el chequeo del lado del servidor.

> Continúa [`ordenes-solo-el-autor-edita.md`](./ordenes-solo-el-autor-edita.md).
> De ese pedido ya está hecho `createdBy` en el DTO del listado; queda pendiente
> la validación, que es lo que pide este documento.

---

## 1 — El agujero, concretamente

Un `usuarioempresa` autenticado tiene un token válido. Con ese token, desde
Postman o desde la consola del navegador, puede hacer esto y hoy **funciona**:

```http
DELETE /api/v1/core/order-deliveries/{id-de-una-orden-de-otro}
Authorization: Bearer {su-propio-token}

→ 200 OK   ← la orden de un compañero, borrada
```

No hace falta ser hacker: alcanza con copiar un id del listado —que el front le
muestra, porque **ver** sí puede— y cambiarlo en la request.

El scoping actual sólo llega hasta la empresa: como la orden **sí** es de
Viralshop, `orderdelivery.access.forbidden` no se dispara y la operación pasa.

De los dos verbos, **`DELETE` es el grave**: no tiene deshacer y devuelve el
stock de los artículos. El `PUT` deja la orden mal, pero al menos es reversible
a mano.

---

## 2 — Lo que pedimos

En `PUT /order-deliveries/{id}` y `DELETE /order-deliveries/{id}`:

> Si el usuario tiene rol **`usuarioempresa`** y el `createdBy` de la orden no
> es el correo de su token → **403**.

Nada más. No hay cambios de DTO, ni de contrato, ni de esquema.

### Alcance

| Rol | Puede editar/eliminar |
|---|---|
| `usuarioempresa` | **Solo las órdenes que creó él** |
| `admin` | Todas las de su alcance, como hoy |
| `superadmin` | Todas, como hoy |

Que el admin quede afuera es a propósito: es la válvula de escape para cuando el
autor se fue de vacaciones o dejó la empresa. Si no, esa orden queda congelada
para siempre.

### Las reglas que ya existen mandan primero

El orden de los chequeos importa para que el mensaje de error sea el correcto:

1. ¿La orden es de su proveedor? → si no, `orderdelivery.access.forbidden`
2. ¿Ya está atendida? → si sí, `orderdelivery.alreadyattended`
3. **¿La creó él?** → si no, la key nueva ← *lo que falta*

---

## 3 — Error keys

| Key | HTTP | Cuándo |
|---|---|---|
| `orderdelivery.edit.notowner` | 403 | `PUT` sobre una orden de otro usuario |
| `orderdelivery.delete.notowner` | 403 | `DELETE` sobre una orden de otro usuario |

**Ya están mapeadas** en `src/services/apiErrorMessages.ts` con sus mensajes en
español, así que en cuanto empiecen a llegar el usuario ve el motivo real y no
un error genérico.

Van dos y no una sola porque el mensaje cambia ("no puede modificarla" vs "no
puede eliminarla").

### El 403 va a llegar aunque el front oculte los botones

No es sólo para el que usa Postman. Pasa en uso normal:

- Dos pestañas abiertas y el listado quedó viejo.
- El usuario tenía el detalle abierto desde antes de que existiera la regla.

Por eso el mensaje importa: quien lo vea no está haciendo nada raro.

---

## 4 — Cómo verificar que quedó bien

Con los dos usuarios de Viralshop —`ruben` y `ruben2`— y una orden creada por
cada uno:

| # | Quién | Qué hace | Esperado |
|---|---|---|---|
| 1 | ruben | `PUT` sobre su propia orden | 200 |
| 2 | ruben | `PUT` sobre la orden de ruben2 | 403 `orderdelivery.edit.notowner` |
| 3 | ruben | `DELETE` sobre la orden de ruben2 | 403 `orderdelivery.delete.notowner` |
| 4 | ruben2 | `DELETE` sobre la orden de ruben | 403 `orderdelivery.delete.notowner` |
| 5 | ruben | `GET` de la orden de ruben2 | 200 — **ver no se restringe** |
| 6 | admin | `PUT` sobre cualquiera de las dos | 200 |
| 7 | ruben | `PUT` sobre una orden **atendida** propia | 409/403 `orderdelivery.alreadyattended`, no la key nueva |

Los casos 2, 3 y 4 son los que hoy devuelven 200 y no deberían. El 5 y el 7
están para que la validación nueva no se lleve puesto lo que ya funcionaba.

---

## 5 — Lo que el front ya tiene hecho

| Cosa | Dónde |
|---|---|
| `isOrderOwner()`, compara correos sin distinguir mayúsculas | `src/utils/orderOwnership.ts` |
| Editar y Eliminar ocultos en el listado | `SupplierOrderDeliveriesTable.tsx` |
| Editar oculto en el detalle | `src/app/proveedor/ordenes/[id]/page.tsx` |
| **Guarda en la pantalla de edición** por si entran escribiendo la URL | `src/app/proveedor/ordenes/[id]/editar/page.tsx` |
| Los dos mensajes de error | `apiErrorMessages.ts` |

Insistimos con lo obvio porque es la razón de este documento: **todo eso vive en
el navegador del usuario y se saltea con Postman**. La única línea que de verdad
cierra el agujero es la de §2.

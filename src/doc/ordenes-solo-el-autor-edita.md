# AirCargo — Órdenes de entrega: solo su autor puede editarlas y eliminarlas

Pedido del **frontend al backend**.

Hoy cualquier `usuarioempresa` de un proveedor puede editar y eliminar las
órdenes de **cualquier otro usuario de ese mismo proveedor**. El scoping actual
llega hasta la empresa (`orderdelivery.access.forbidden`) y ahí se detiene.

Queremos bajar el límite un nivel: **de la empresa a la persona**.

| Parte | Contenido |
|---|---|
| [1](#1--el-problema) | Por qué el límite por empresa no alcanza |
| [2](#2--la-regla) | Qué queremos exactamente, y para quién |
| [3](#3--lo-que-necesitamos) | Validación, error keys y **`createdBy` en el listado** |
| [4](#4--la-válvula-de-escape-el-autor-que-ya-no-está) | El caso que la regla rompe, y cómo lo tapamos |
| [5](#5--lo-que-el-front-ya-hizo) | Qué está listo esperando el backend |

---

## 1 — El problema

Las órdenes de entrega son **trabajo diario**: un proveedor con varias personas
cargando pedidos genera decenas por día, todas mezcladas en el mismo listado.

Con el límite actual por empresa, dos cosas que ya pueden pasar:

- **Error honesto.** Dos filas seguidas, cliente parecido, alguien edita la que
  no era. La orden ajena queda mal y el autor no se entera.
- **Borrado malicioso o por descuido.** Eliminar es peor: no hay deshacer, y
  hoy un usuario puede borrar el trabajo de un compañero sin ninguna barrera.

El dato de quién la creó ya existe (`createdBy`, el correo), pero **no se usa
para decidir nada**.

---

## 2 — La regla

> Una orden de entrega solo puede ser **editada** o **eliminada** por el usuario
> que la creó.

### Alcance: solo `usuarioempresa`

La restricción aplica al rol del proveedor. **`admin` y `superadmin` no quedan
alcanzados** y conservan lo que pueden hacer hoy — eso es deliberado y es lo que
resuelve §4.

### No cambia nada más

- **Ver** sigue siendo de todo el proveedor: el listado y el detalle se ven
  completos, como hasta ahora. Lo que se restringe es escribir.
- Las reglas que ya existen **siguen y mandan primero**: una orden atendida no
  se edita ni se borra, sea de quien sea.
- Crear no cambia.

---

## 3 — Lo que necesitamos

### 3.1 — La validación, en el backend

En `PUT /order-deliveries/{id}` y en `DELETE /order-deliveries/{id}`, cuando el
usuario es `usuarioempresa`: si `createdBy` de la orden no es el correo del
token, **403**.

Esto es lo único que realmente protege. Lo que hace el front (§5) es esconder
botones, y cualquiera puede saltearlo llamando al endpoint desde la consola del
navegador.

### 3.2 — Dos error keys

| Key | HTTP | Cuándo |
|---|---|---|
| `orderdelivery.edit.notowner` | 403 | `PUT` sobre una orden de otro usuario |
| `orderdelivery.delete.notowner` | 403 | `DELETE` sobre una orden de otro usuario |

Ya están mapeadas en `src/services/apiErrorMessages.ts` con sus mensajes.

Van separadas y no una sola genérica porque el mensaje al usuario es distinto
("no puede modificarla" vs "no puede eliminarla") y porque el 403 va a seguir
llegando aunque el front oculte los botones: dos pestañas abiertas, o un
listado sin refrescar, alcanzan para que alguien intente igual.

### 3.3 — `createdBy` en el DTO del listado ⚠️ **Esto es lo que falta**

`OrderDelivery` (detalle) ya lo trae. **`OrderDeliveryPaginatedItem` no.**

Sin ese campo en el listado, el front no puede saber de quién es cada fila y
**tiene que mostrarle a todos los botones de Editar y Eliminar en todas las
filas**, para que después la mitad rebote con 403. Justo lo que queremos evitar.

```jsonc
// OrderDeliveryPaginatedItem
{
  "id": "…",
  "clientFullName": "Andres Rodriguez",
  "createdBy": "ruben@gmail.com",   // ← lo que falta
  "isAttended": false
}
```

Es el mismo valor que ya devuelven en el detalle. **Es el único cambio de DTO
del pedido**, y es el que más se nota en pantalla.

---

## 4 — La válvula de escape: el autor que ya no está

Hay un caso que la regla rompe y conviene decirlo antes de implementarla:

> Ruben carga una orden con el teléfono mal, se va de vacaciones dos semanas (o
> deja la empresa). Nadie de Viralshop puede corregirla.

Por eso el alcance de §2 excluye a `admin` y `superadmin`: **el admin sigue
pudiendo editar y eliminar cualquier orden**, así que siempre hay alguien que
puede destrabar el caso. La orden no queda congelada, solo deja de estar en
manos de cualquier compañero.

Si prefieren que la restricción alcance también al admin, díganlo, pero
entonces habría que definir qué hace el proveedor cuando su autor ya no está.

---

## 5 — Lo que el front ya hizo

Todo lo de abajo está en el código y **degrada solo**: mientras
`OrderDeliveryPaginatedItem` no traiga `createdBy`, se comporta exactamente como
hoy. Cuando el campo llegue, el filtrado se activa sin tocar nada.

| Cambio | Dónde |
|---|---|
| `isOrderOwner(order, userEmail)`, comparando correos sin distinguir mayúsculas | `src/utils/orderOwnership.ts` |
| Editar y Eliminar ocultos sobre órdenes ajenas | `SupplierOrderDeliveriesTable.tsx` |
| Editar oculto en el detalle | `src/app/proveedor/ordenes/[id]/page.tsx` |
| Las dos error keys con su mensaje | `apiErrorMessages.ts` |
| `createdBy` tipado como opcional en el listado | `orderDeliveryService.ts` |

El helper devuelve `true` cuando no hay `createdBy` con qué comparar. Es a
propósito: preferimos que hoy se vea de más y no ocultar acciones que sí
funcionan.

---

## Resumen para priorizar

| Pedido | Esfuerzo estimado | Qué desbloquea |
|---|---|---|
| `createdBy` en `OrderDeliveryPaginatedItem` | Una propiedad en el DTO | **Que los botones se oculten**; sin esto lo demás no se ve |
| Validación en `PUT` y `DELETE` + las 2 keys | Un chequeo por handler | La protección real |

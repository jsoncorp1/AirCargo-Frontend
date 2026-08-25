# AirCargo — Órdenes de entrega: falta `attendedAt`

> ⚠️ **El pedido de `attendedAt` se movió** a
> [`ordenes-atencion-quien-y-cuando.md`](./ordenes-atencion-quien-y-cuando.md),
> que lo amplía con **quién** atendió la orden y el **vínculo al envío**, y
> propone el backfill de las órdenes viejas.
>
> Este documento se deja por el contexto de la columna de fecha del listado y
> el `sortBy=attendedAt`, que siguen vigentes. **Para implementar, usar el otro.**

Pedido del **frontend al backend**. Queda uno solo; el resto ya está resuelto.

| Pedido | Estado |
|---|---|
| `attendedAt` en los DTOs | **Pendiente** — es lo de abajo |
| `clientPhone` en el DTO del listado | ✅ Resuelto |
| Filtro de "ya atendidas" | ✅ Resuelto con `attentionStatus` |
| Rango de fechas | ✅ Resuelto con `dateFrom` / `dateTo` |
| Ordenar por fecha de atención | Sin efecto hasta que exista `attendedAt` |

---

## `attendedAt`

## Qué queremos mostrar

### 1. El flujo de estados del detalle ← **esto ya está en pantalla, incompleto**

La vista de detalle de la orden (`/proveedor/ordenes/{id}`) muestra el ciclo de
vida como una línea de tiempo con dos hitos:

```
 (✓) Creada                      (✓) Atendida
     14/8/2026 · 02:21 p. m.         ← acá va attendedAt
```

El primer hito sale de `createdAt` y funciona. El segundo se pinta verde cuando
`isAttended` es `true`, pero **debajo no hay fecha que poner**: en su lugar dice
"Sin fecha registrada", que es exactamente el agujero que este documento pide
tapar.

El front ya tiene `attendedAt?: string | null` tipado en los dos DTOs, así que
en cuanto el backend lo mande, el hito muestra la fecha solo — no hay que tocar
nada más.

### 2. La columna de fecha del listado

Las tres pantallas de órdenes tienen las pestañas **Por atender / Atendidas /
Todas**, ya funcionando contra `attentionStatus`. La idea es que la columna de
fecha cambie de significado según la pestaña:

| Pestaña | Qué debería mostrar la columna |
|---|---|
| Por atender | Fecha y hora en que el usuario empresa **creó** la orden |
| Atendidas | Fecha y hora en que el mostrador la **atendió** |
| Todas | La de atención, o la de creación si todavía no se atendió |

## Por qué no se puede hoy

El DTO solo trae un booleano:

```ts
// OrderDelivery y OrderDeliveryPaginatedItem
isAttended: boolean;
createdAt: string;
// falta: attendedAt
```

Sabemos **si** se atendió, pero no **cuándo**. No hay dato que poner en la
columna.

## Qué necesitamos

Un `attendedAt` en los dos DTOs — el del listado y el del detalle:

```jsonc
{
  "id": "…",
  "isAttended": true,
  "createdAt": "2026-08-13T12:00:00Z",
  "attendedAt": "2026-08-13T15:42:00Z"   // null mientras no se haya atendido
}
```

Se setea en el mismo momento en que `isAttended` pasa a `true` (cuando se crea
el envío a partir de la orden). Para las órdenes ya atendidas antes de este
cambio va a quedar en `null`; con eso alcanza, la UI muestra un guión.

> Si el dato ya existe en la tabla con otro nombre y solo falta exponerlo en el
> DTO, mejor todavía: avisen cómo se llama y lo usamos.

## Y ya que están: ordenar por fecha de atención

Si la columna de la pestaña "Atendidas" muestra la fecha de atención, ordenar
por fecha de creación deja la lista en un orden que no coincide con lo que se
ve. Si pueden aceptar un `sortBy=attendedAt`, mejor; no es bloqueante.

---

## Qué hacemos nosotros cuando esto exista

Agregar `attendedAt` a los dos DTOs y hacer que la columna de fecha cambie de
encabezado y de contenido según la pestaña, en las tres pantallas.

Todo lo demás ya está puesto: las pestañas contra `attentionStatus`, el teléfono
del receptor en la tabla, los contadores desde el `count` del servidor y el
filtro por rango de fechas con hoy como valor inicial.

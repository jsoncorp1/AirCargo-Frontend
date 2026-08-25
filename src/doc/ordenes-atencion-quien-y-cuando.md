# AirCargo — Órdenes de entrega: quién las atendió, cuándo, y con qué envío

Pedido del **frontend al backend**.

Hoy una orden atendida es un callejón sin salida: sabemos que se atendió, pero
no cuándo, ni quién, ni a qué envío dio lugar. Los tres datos existen —están del
lado del envío— pero no hay forma de llegar a ellos desde la orden.

> **Reemplaza al pedido de `attendedAt`** de
> [`ordenes-fecha-de-atencion.md`](./ordenes-fecha-de-atencion.md), que pedía
> solo la fecha. Este documento lo amplía con el quién y el vínculo al envío.
> Lo demás de ese documento sigue vigente.

| Parte | Contenido |
|---|---|
| [1](#1--qué-pasa-hoy) | El hueco, con la pantalla que ya lo muestra |
| [2](#2--lo-que-pedimos) | Los 4 campos, con request y response |
| [3](#3--la-alternativa-que-descartamos-y-por-qué) | Filtrar `/shipments` por orden |
| [4](#4--backfill-esta-vez-sí-se-puede) | Las órdenes viejas se pueden completar |
| [5](#5--decisiones-que-necesitamos-que-tomen-ustedes) | **Lo que está bloqueado hasta que respondan** |

---

## 1 — Qué pasa hoy

### El DTO de la orden

```ts
// OrderDelivery y OrderDeliveryPaginatedItem
isAttended: boolean;      // sabemos SI
createdAt: string;
// falta: cuándo, quién, y con qué envío
```

### El hueco ya está en pantalla

La vista de detalle (`/proveedor/ordenes/{id}`) muestra el ciclo de vida de la
orden como una línea de tiempo:

```
 (✓) Creada                      (✓) Atendida
     14/8/2026 · 02:21 p. m.         "Sin fecha registrada"  ← el hueco
```

El hito se pinta verde con `isAttended`, pero abajo no hay nada que poner. El
front ya tiene `attendedAt?: string | null` tipado en los dos DTOs
(`src/services/orderDeliveryService.ts`) esperando el dato.

### Lo llamativo: el dato ya existe

El envío que nace de la orden **ya guarda las dos cosas**, con estos nombres
exactos en `Shipment`:

| Campo del envío | Qué es, desde la orden |
|---|---|
| `createdAt` | Cuándo se atendió la orden |
| `createdBy` | Quién la atendió |
| `orderDeliveryId` | El vínculo, pero **apunta al revés** |

El problema es la dirección: desde el envío se llega a la orden, desde la orden
no se llega al envío. `ShipmentListFilters` no acepta `orderDeliveryId`
(`src/services/shipmentService.ts`), así que el front no tiene forma de
preguntar "¿cuál es el envío de esta orden?".

---

## 2 — Lo que pedimos

Cuatro campos en `OrderDelivery` (detalle) y en `OrderDeliveryPaginatedItem`
(listado). Todos **nullable**, todos de solo lectura:

```jsonc
{
  "id": "…",
  "isAttended": true,
  "createdAt": "2026-08-14T14:21:00Z",

  "attendedAt": "2026-08-14T17:03:00Z",          // null mientras no se atendió
  "attendedByFullName": "María Gutiérrez",       // null
  "shipmentId": "…uuid…",                        // null
  "shipmentWaybillNumber": "AC-000123"           // null
}
```

### Que se setee solo, en la misma transacción

Lo importante: **no queremos un endpoint para setearlo**. Los dos primeros
campos tienen que escribirse en el mismo lugar y en la misma transacción donde
hoy `isAttended` pasa a `true` —es decir, al crear el envío a partir de la
orden—, tomando la hora del servidor y el usuario del token.

Si quedara del lado del front habría dos fuentes de verdad y órdenes atendidas
sin fecha cada vez que se corte una request a la mitad.

### Por qué también el vínculo al envío

Los dos últimos campos no son para la línea de tiempo, son para **poder navegar**.
Hoy el proveedor ve "Atendida" y ahí se termina: no puede llegar al envío que
generó su orden ni ver en qué anda el paquete.

Con `shipmentId` y `shipmentWaybillNumber` ponemos un botón **"Ver envío
AC-000123"** en el detalle de la orden, que es la pregunta natural que sigue
después de "¿ya la atendieron?".

`attendedByFullName` alcanza: el nombre para mostrar. Si les resulta más natural
exponer también `attendedByUserId`, lo tomamos, pero no lo necesitamos.

---

## 3 — La alternativa que descartamos, y por qué

La otra forma de resolverlo era **no tocar el DTO de la orden** y agregar un
filtro `orderDeliveryId` a `GET /shipments`, para que el front busque el envío y
saque de ahí `createdAt` y `createdBy`.

La descartamos, pero la dejamos escrita por si del lado de ustedes es mucho más
barata — en ese caso hablemos, porque **también nos sirve**.

Las razones para preferir los campos en la orden:

1. **El listado se vuelve inviable.** El detalle hace un `GET` y podría hacer un
   segundo. Pero la columna de fecha del listado ("Atendidas" debería mostrar la
   fecha de atención, ver el otro documento) necesita el dato para **cada fila**:
   con el filtro serían 10 requests por página, o un join en el front.
2. **Es un hecho de la orden.** "Cuándo se atendió esta orden" describe a la
   orden. Que hoy ese dato viva solo en el envío es una consecuencia de cómo se
   implementó, no de cómo se piensa el negocio.
3. **El envío se puede borrar.** `deleteShipment` existe. Si un envío se elimina,
   ¿la orden vuelve a estar sin atender? Si la respuesta es sí, los campos se
   limpian en esa misma operación y queda coherente. Si es no, con el filtro el
   dato se pierde y con los campos se conserva. Ver §5.2.

---

## 4 — Backfill: esta vez sí se puede

A diferencia de la sucursal de destino —donde no había de dónde sacar el dato y
quedamos en que las órdenes viejas se quedaban en `null`—, acá **el dato
histórico existe**.

Para toda orden con `isAttended = true` hay un envío con su `orderDeliveryId`
apuntándola. El backfill sale de ahí:

```sql
-- La idea, no la migración
UPDATE order_deliveries o
SET    attended_at    = s.created_at,
       attended_by    = s.created_by,
       shipment_id    = s.id
FROM   shipments s
WHERE  s.order_delivery_id = o.id
  AND  o.is_attended = true;
```

Vale la pena hacerlo: sin backfill, todas las órdenes atendidas hasta hoy
muestran el hito en verde con "Sin fecha registrada", y el usuario no distingue
entre "es una orden vieja" y "algo falló".

Si hay órdenes atendidas **sin** envío asociado, eso ya es una inconsistencia
que valdría la pena mirar — avisen si el `UPDATE` deja filas afuera.

---

## 5 — Decisiones que necesitamos que tomen ustedes

### 5.1 — ¿Qué pasa con las órdenes esporádicas?

Las de mostrador nacen atendidas: el envío y la orden se crean juntos en
`POST /shipments/sporadic`. Damos por hecho que ahí `attendedAt = createdAt` y
`attendedByFullName` es quien atendió el mostrador, pero confírmenlo.

### 5.2 — Si se borra el envío, ¿la orden vuelve a "por atender"?

`deleteShipment` existe y no sabemos qué le hace hoy a `isAttended` de la orden.
Sea cual sea la respuesta, los campos nuevos tienen que seguirla: si la orden
vuelve a estar sin atender, los cuatro campos se limpian en la misma operación.
Lo que no queremos es una orden con `isAttended = false` y `attendedAt` con
fecha.

### 5.3 — ¿`attendedByFullName` o el id también?

Nosotros solo mostramos el nombre. Si prefieren mandar `attendedByUserId` y que
el front resuelva el nombre, no nos sirve: no tenemos un endpoint de usuarios al
alcance del rol `usuarioempresa`. Si mandan el id, que venga **acompañado** del
nombre.

### 5.4 — ¿Vale la pena el `sortBy=attendedAt`?

Sigue de pie del documento anterior: si la pestaña "Atendidas" muestra la fecha
de atención, ordenar por fecha de creación deja la lista en un orden que no
coincide con lo que se ve. No es bloqueante.

---

## Qué hace el front cuando esto exista

| Cambio | Dónde | Estado |
|---|---|---|
| Fecha en el hito "Atendida" | `SupplierOrderDetailView.tsx` | **Ya está**, espera el campo |
| Tipar los 4 campos | `orderDeliveryService.ts` | `attendedAt` ya está tipado |
| "Atendida por María Gutiérrez" bajo el hito | `SupplierOrderDetailView.tsx` | Nuevo |
| Botón "Ver envío AC-000123" | `SupplierOrderDetailView.tsx` | Nuevo |
| Columna de fecha según la pestaña | Las 3 tablas de órdenes | Ver el otro documento |

---

## Resumen para priorizar

| Pedido | Esfuerzo estimado | Qué desbloquea |
|---|---|---|
| `attendedAt` + `attendedByFullName` | 2 columnas + set en la transacción | La línea de tiempo, que ya está en pantalla incompleta |
| Backfill desde `shipments` | Un `UPDATE` | Que las órdenes viejas no se vean rotas |
| `shipmentId` + `shipmentWaybillNumber` | 1 columna o un join | Navegar de la orden al envío |

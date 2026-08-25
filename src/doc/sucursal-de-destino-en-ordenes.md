# AirCargo — Sucursal de destino en la orden de entrega

> ## ✅ RESUELTO — el backend implementó todo
>
> Este documento es **el pedido original**, se deja como registro de por qué se
> pidió cada cosa. El backend respondió con su propio documento y el front ya
> está adaptado.
>
> | Pedido | Estado |
> |---|---|
> | §6.1 — permiso de lectura a `usuarioempresa` | ✅ Concedido |
> | §3 — `destinationBranchOfficeId` en la orden | ✅ Implementado, opcional |
> | §2 — filtro `department` | ✅ Implementado (solo nombre del enum) |
> | §2 — filtro `active` | ❌ No se hizo, **y con razón**: el endpoint nunca devolvió sucursales dadas de baja, así que el `.filter()` en memoria que teníamos no descartaba nada. Ya se borró. |
>
> **Queda una pregunta abierta**, ver [§7](#7--pendiente-editar-una-orden-cuya-sucursal-se-dio-de-baja).

Pedido del **frontend al backend**. Hoy el proveedor sólo puede declarar el
*departamento* de destino, y la sucursal exacta la termina eligiendo el admin
cuando convierte la orden en envío. Eso deja la decisión en manos de quien no
tiene la información.

Son **dos pedidos**, y conviene leerlos en ese orden porque el segundo es el
que realmente desbloquea la funcionalidad.

| Parte | Contenido |
|---|---|
| [1](#1--qué-hay-hoy) | El flujo actual y por qué se rompe |
| [2](#2--pedido-a-filtro-por-departamento-en-branch-offices) | Filtro `department` en `GET /branch-offices` |
| [3](#3--pedido-b-destinationbranchofficeid-en-la-orden) | **`destinationBranchOfficeId` en la orden** — el que importa |
| [4](#4--qué-hace-el-front-cuando-esto-exista) | Qué cambia del lado nuestro |
| [5](#5--error-keys) | Claves de error esperadas |
| [6](#6--decisiones-que-necesitamos-que-tomen-ustedes) | **Lo que está bloqueado hasta que respondan** |

---

## 1 — Qué hay hoy

### El flujo en dos etapas

1. **El proveedor** (`usuarioempresa`) crea la orden y elige únicamente
   `destinationDepartment`, un enum de los 9 departamentos. Está hardcodeado en
   el front (`src/components/proveedor/SupplierOrderDeliveryForm.tsx`), no sale
   de ningún endpoint.
2. **El admin**, al crear el envío, elige `destinationBranchOfficeId` — que en
   `CreateShipmentRequest` **es obligatorio**. Ese selector ya viene filtrado
   por el departamento de la orden
   (`src/components/envios/ShipmentForm.tsx`, el `.filter()` sobre
   `b.bolivianDepartment === orderInfo.destinationDepartment`).

### El problema

La sucursal exacta se decide igual, pero más tarde y por la persona equivocada.

El caso concreto: **La Paz tiene sucursal en La Paz y en El Alto**. El proveedor
habló con el cliente y sabe cuál corresponde; el admin en el mostrador ve
`destinationDepartment: "LaPaz"` y tiene que adivinar. Lo mismo va a pasar en
cualquier departamento donde se abra una segunda sucursal.

### Qué NO queremos

Un selector de *ciudades*. `city` es un `string` suelto dentro de `BranchOffice`,
no hay catálogo de ciudades en el sistema, y listar ciudades sin sucursal sería
ofrecer destinos que no existen. La entidad correcta es la sucursal; la ciudad
es sólo su etiqueta visible.

---

## 2 — Pedido A: filtro por departamento en `/branch-offices`

### `GET /api/v1/core/branch-offices` — sumar `department` y `active`

Hoy sólo acepta `Page` y `PerPage`. Pedimos dos query params más, **ambos
opcionales**: omitidos, el endpoint se comporta exactamente como ahora, así que
no rompe a ningún consumidor actual.

```
GET /api/v1/core/branch-offices?page=1&perPage=100&department=LaPaz&active=true
```

| Param | Tipo | Requerido | Notas |
|---|---|---|---|
| `department` | string | No | Nombre del enum `BolivianDepartment`, **el mismo string que ya devuelven** en el campo `bolivianDepartment` de la respuesta |
| `active` | boolean | No | Hoy el front trae todas y descarta las inactivas en memoria |

Valores válidos de `department` — idénticos a los que ya emite la API:

```
Beni · Chuquisaca · Cochabamba · LaPaz · Oruro · Pando · Potosi · SantaCruz · Tarija
```

**Importante:** que sea el nombre del enum y **no un índice numérico**. La API
hoy es inconsistente en esto — `CreateOrderDeliveryRequest.destinationDepartment`
es un `number` (índice) mientras que las respuestas devuelven el nombre — y eso
ya obliga al front a mapear índices a mano contra un arreglo hardcodeado, que es
frágil. En params nuevos preferimos el nombre.

La respuesta mantiene el mismo sobre de paginación de siempre (`page`,
`perPage`, `totalPages`, `count`, `data`), con `count` reflejando el total
**ya filtrado**.

### Honestidad sobre la prioridad

Este filtro es **cómodo, no bloqueante**. El front ya trae hasta 100 sucursales
de una y filtra en memoria (es lo que hace `ShipmentForm` y lo que acabamos de
hacer en el formulario del proveedor). Con una red chica eso incluso responde
mejor, porque cambiar de departamento no dispara un round-trip.

El filtro pasa a importar de verdad cuando la red crezca lo suficiente como para
no entrar en una página, o si quieren que el front deje de asumir que
`perPage=100` alcanza. Vale la pena hacerlo, pero **no destraba nada por sí
solo**: sin el pedido B de abajo, la sucursal elegida no se puede guardar.

---

## 3 — Pedido B: `destinationBranchOfficeId` en la orden

Este es el que convierte la pantalla en algo real.

### 3.1 En el request de crear y editar

`CreateOrderDeliveryRequest` y `UpdateOrderDeliveryRequest` suman un campo
**opcional**:

```jsonc
{
  "destinationDepartment": 3,
  "destinationBranchOfficeId": "…uuid…",   // NUEVO, opcional
  "clientFullName": "Juan Pérez",
  "clientPhone": "+591 71234567",
  "clientAddress": "Av. Principal #123",
  "deliveryType": 0,
  "isExpress": false,
  "lines": [ /* … */ ]
}
```

Opcional y no obligatorio, por tres razones: las órdenes ya existentes no lo
tienen, las esporádicas nacen por otro camino (`/shipments/sporadic`), y hay
departamentos sin sucursal donde no habría nada que elegir.

**Validación pedida:** si viene, la sucursal tiene que pertenecer al
`destinationDepartment` de la orden. Si no coincide, 400 con
`orderdelivery.destinationbranch.mismatch`. No queremos que el backend
"corrija" el departamento en silencio: preferimos el error explícito.

### 3.2 En las respuestas

Que `OrderDelivery` (detalle) y `OrderDeliveryPaginatedItem` (listado)
devuelvan el mismo trío que **ya usan los envíos**, para no inventar una forma
nueva de decir lo mismo:

```jsonc
{
  "destinationDepartment": "LaPaz",
  "destinationBranchOfficeId": "…uuid…",     // null si la orden no lo tiene
  "destinationBranchOfficeCode": "ELT",      // null
  "destinationBranchOfficeCity": "El Alto"   // null
}
```

En `ShipmentResponse` esos tres campos ya existen con exactamente esos nombres.
Manteniéndolos iguales, el front reusa el mismo formateo en las dos pantallas.

### 3.3 Qué debería pasar al crear el envío

Cuando el admin abre el formulario de envío sobre una orden que **sí** trae
`destinationBranchOfficeId`, el front la va a **preseleccionar**. El admin
sigue pudiendo cambiarla — la orden es una indicación del proveedor, no una
orden de mando.

Del lado del backend eso no requiere nada nuevo: `CreateShipmentRequest` ya
recibe `destinationBranchOfficeId` y sigue siendo obligatorio ahí.

---

## 4 — Qué hace el front cuando esto exista

El selector en cascada **ya está construido y andando** en
`src/components/proveedor/SupplierOrderDeliveryForm.tsx`: se elige departamento
y el segundo select se puebla con las sucursales de ese departamento, mostradas
como `Ciudad — Código` (ej. `El Alto — ELT`).

Lo único que le falta es que el valor viaje. Cuando tengamos el pedido B:

| Cambio | Dónde |
|---|---|
| Sumar `destinationBranchOfficeId` al payload | `SupplierOrderDeliveryForm.tsx` |
| Cargar la sucursal guardada al editar / ver | idem |
| Tipar el campo nuevo en los DTOs | `src/services/orderDeliveryService.ts` |
| Preseleccionar la sucursal al crear el envío | `src/components/envios/ShipmentForm.tsx` |
| Mostrar la sucursal en el listado y el detalle | tablas de órdenes |

Con el pedido A además cambiaríamos la carga en memoria por una llamada
filtrada, pero eso es optimización, no funcionalidad.

---

## 5 — Error keys

Siguiendo el formato de siempre (ProblemDetails con `title` = error key):

| Situación | Key esperada |
|---|---|
| `department` con un valor que no es del enum | `branchoffice.department.invalid` |
| La sucursal no existe o está inactiva | `orderdelivery.destinationbranch.notfound` |
| La sucursal no pertenece al departamento de la orden | `orderdelivery.destinationbranch.mismatch` |

---

## 6 — Decisiones que necesitamos que tomen ustedes

### 6.1 — ¿`/branch-offices` está permitido para `usuarioempresa`? ⚠️ **Bloqueante hoy**

Es la pregunta más urgente y no depende de ninguna feature nueva.

Hasta ahora ese endpoint **sólo lo consumían pantallas de admin**
(`ShipmentForm`, `ConductorForm`, `UsuariosTable`, `CreateManifestModal`,
`SucursalesTable`, entre otras). Ninguna pantalla del proveedor lo había
llamado nunca. No sabemos si el rol `usuarioempresa` tiene permiso.

El front ya contempla que falle: la llamada va en su propio `try/catch`
separado del de artículos, y si da 403 el formulario sigue siendo usable con el
selector de sucursal deshabilitado. Pero si la idea es que el proveedor elija
sucursal, **necesita poder leer la lista**.

Si les preocupa exponer la red completa: alcanza con devolverle sólo las
sucursales activas, sin `latitude` / `longitude` / `phone` si lo consideran
sensible. Los datos que el selector realmente necesita son `id`,
`bolivianDepartment`, `city` y `code`.

### 6.2 — ¿Opcional u obligatorio?

Nosotros proponemos **opcional** (§3.1). Si prefieren obligatorio, hace falta
definir qué pasa con los departamentos que no tienen ninguna sucursal cargada:
hoy el selector muestra "Sin sucursales en este departamento" y deja seguir.

### 6.3 — ¿Qué pasa con las órdenes esporádicas?

`CreateSporadicShipmentRequest` ya recibe `destinationBranchOfficeId` para el
envío. ¿La orden que se genera detrás hereda esa sucursal, o queda en `null`?
Nos inclinamos por heredarla — es la misma información.

### 6.4 — ¿`destinationDepartment` se sigue mandando?

Si la orden trae sucursal, el departamento es derivable de ella. Igual
proponemos **seguir mandando los dos** y que el backend valide la coherencia
(§3.1), en vez de que el front deje de mandar el departamento: hay órdenes sin
sucursal y romper ese campo afectaría los filtros por departamento del listado
del admin.

---

## 7 — Pendiente: editar una orden cuya sucursal se dio de baja

Única pregunta que quedó abierta después de la implementación. Nace del cruce
de dos reglas que por separado están bien:

- Mandar una sucursal dada de baja responde **404
  `orderdelivery.destinationbranch.notfound`**.
- El `PUT` reemplaza la orden completa, así que hay que **precargar la sucursal
  del `GET` y remandarla** o se borra.

Si una sucursal cierra mientras hay órdenes viejas sin atender, esas órdenes
quedan **imposibles de editar**: el `GET` devuelve un id que el `PUT` rechaza,
y la única salida es mandar `null`, que borra el dato histórico.

**Qué hace el front mientras tanto:** los dos formularios detectan que la
sucursal guardada ya no está en el listado del departamento y la muestran como
`Ciudad — CÓDIGO (dada de baja)`, con la ayuda *"La sucursal declarada ya no
está activa: elegí otra para poder guardar"*. Si el usuario guarda sin cambiarla
va a ver el 404 traducido. Es explícito, pero lo obliga a pisar el dato.

**Lo que habría que definir:** si el `PUT` debería aceptar una sucursal dada de
baja cuando es *la misma que ya tenía la orden* (o sea, cuando no se está
cambiando el valor). Eso permitiría editar el teléfono sin tocar el histórico.

---

## Resumen para priorizar

| Pedido | Esfuerzo estimado | Qué desbloquea |
|---|---|---|
| §6.1 — permiso de lectura a `usuarioempresa` | Config de rol | **Que el selector muestre algo** |
| §3 — `destinationBranchOfficeId` en la orden | Campo + validación + DTOs | Que la elección se guarde y llegue al envío |
| §2 — filtro `department` / `active` | Query params | Nada funcional; prolija la carga |

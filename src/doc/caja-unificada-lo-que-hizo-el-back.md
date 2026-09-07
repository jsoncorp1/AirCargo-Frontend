# Caja unificada, candado de emisión, reporte de QR y Excel en el backend

Respuesta al `PEDIDO-CAJA-UNIFICADA-PARA-BACK.md` del **2026-09-05**. Las cuatro
partes están hechas y probadas contra la base de desarrollo.

Este documento **reemplaza** a `CAJA-Y-ARQUEO-PARA-FRONT.md` en todo lo que toca
la caja. Lo que ese documento dice de anulación de guías, facturación y
liquidaciones sigue vigente.

---

## 0. Lo que cambió, en una tabla

| # | Pieza | Estado |
|---|---|---|
| 1 | Caja unificada: se disolvió `PettyCashPeriod` | ✅ |
| 2 | Cerrar congela las guías · sin caja no se emite | ✅ |
| 3 | QR fuera del saldo, reportado por día y por mes | ✅ |
| 4 | Excel en el backend, sin tope de filas | ✅ |

**Lo que hay que mirar antes de empezar a codear:** las secciones 2 (rutas), 9
(errores nuevos y renombrados) y 12 (dos filtros del pedido que no existen).

---

# PARTE 1 · La caja es una sola

## 1. El modelo

Un solo libro por sucursal. `PettyCashPeriod`, `PettyCashPeriodStatus`,
`PettyCashMovement` y `PettyCashMovementKind` **ya no existen**: sus tablas se
borraron y su ciclo lo absorbió `CashRegisterSession`.

```
saldo (balance) =  openingCash
                +  collectedCash      Σ envíos cobrados en EFECTIVO en la ventana
                +  movementsIncome    Σ ingresos manuales
                −  movementsExpense   Σ egresos manuales
```

El QR **no entra**: viaja en `expectedQr`, aparte.

`balance` lo calcula el backend y viene resuelto en `current` y en el detalle.
No hace falta acumular las cuatro partes del lado del front.

### Movimientos: dos tipos y nada más

```ts
type CashMovementKind =
  | 'Income'    // el jefe manda plata · la rendición del conductor
  | 'Expense';  // taxi, insumos · y la plata que se le manda al jefe
```

No hay tipo "depósito": la remesa al jefe **es un egreso**. Lo único que cambia
es la descripción.

### La rendición del conductor

Un `Income` puede llevar `settledByDriverId`. Es **opcional**, pero si se manda
tiene que ser un usuario con rol `conductor` —si no, `400
cashregister.movement.driver.invalid`—. La respuesta y el listado devuelven
`settledByDriver` (correo) y `settledByDriverName`.

No hay todavía una liquidación de contraentrega contra la cual saldar, así que
por ahora la referencia sirve para agrupar y auditar, no para cerrar un saldo.

## 2. Los endpoints

Todos bajo `api/v1/core/cash-register`, tag de Swagger **`Core / Caja`** (antes
`Core / Caja Chica`).

| Verbo | Ruta | Rol | Cambio |
|---|---|---|---|
| `GET` | `/cash-register/sessions/carried` | admin | **nuevo** |
| `POST` | `/cash-register/sessions` | admin | **ahora con body** |
| `GET` | `/cash-register/sessions/current` | admin | forma nueva |
| `GET` | `/cash-register/sessions/{id}` | superadmin, admin | forma nueva |
| `GET` | `/cash-register/sessions` | superadmin, admin | forma nueva |
| `POST` | `/cash-register/sessions/{id}/close` | admin | contra el saldo completo |
| `POST` | `/cash-register/movements` | admin | era `/petty-cash/movements` |
| `PUT` | `/cash-register/movements/{id}` | admin | ídem |
| `DELETE` | `/cash-register/movements/{id}` | admin | ídem |
| `POST` | `/cash-register/movements/{id}/receipt` | admin | ídem |
| `GET` | `/cash-register/qr-summary` | superadmin, admin | **nuevo** |
| `GET` | `/cash-register/daily` | superadmin, admin | sin cambios |

**Borrados, devuelven 404:** los nueve de `petty-cash`, incluido
`POST /petty-cash/periods/{id}/reopen`. **No hay reabrir**, ni para el
superadmin: una caja cerrada por error se resuelve abriendo la siguiente.

> `/cash-register/daily` sigue existiendo y **no es el arqueo**. Responde
> "cuánto cobró *fulano* hoy". El arqueo del cajón es de la sucursal y va por
> `sessions`.

## 3. Abrir la caja

Primero se pregunta cuánto arrastra:

```jsonc
// GET /api/v1/core/cash-register/sessions/carried  → 200 OK
{
  "branchOfficeId": "…",
  "branchOfficeCode": "SCZ-01",
  "carriedCash": 710.00,          // lo que dejó contado el cierre anterior
  "lastSessionId": "…",           // null en la primera caja de la sucursal
  "lastClosedAt": "2026-09-05T13:41:07Z",
  "lastClosedDay": "2026-09-05",
  "lastClosedBy": "heidy@aircargo.bo",
  "hasOpenSession": false         // true → mandar directo al arqueo, no a abrir
}
```

Existe aparte de `current` porque la apertura ocurre justamente cuando no hay
caja abierta y `current` devuelve 404.

La pantalla propone `carriedCash` ya cargado y la encargada lo confirma contando:

```jsonc
// POST /api/v1/core/cash-register/sessions
{ "openingCash": 710, "openingNotes": null }

// 201 Created
{
  "id": "…", "branchOfficeId": "…", "branchOfficeCode": "SCZ-01",
  "status": "Open",
  "carriedCash": 710.00,
  "openingCash": 710.00,
  "openingDifference": 0.00,      // contado − arrastrado
  "openingNotes": null,
  "openedAt": "2026-09-05T13:42:19Z",
  "openedBy": "heidy@aircargo.bo"
}
```

**Si `openingCash` difiere de `carriedCash`, `openingNotes` es obligatoria.** Sin
ella: `400 cashregister.openingnotes.required`. Es el mismo mecanismo del cierre
aplicado a la apertura, y también está como CHECK en la base.

`openingCash: 0` es válido —una sucursal que arranca sin sencillo—; lo que no se
acepta es un negativo.

## 4. La pantalla del mostrador

`GET /cash-register/sessions/current` trae todo armado:

```jsonc
{
  "id": "…",
  "branchOfficeId": "…", "branchOfficeCode": "SCZ-01", "branchOfficeCity": "Santa Cruz",
  "status": "Open",

  "carriedCash": 710.00,
  "openingCash": 700.00,
  "openingDifference": -10.00,
  "openingNotes": "faltaban 10 Bs al abrir, se avisa al jefe",

  "collectedCash": 1730.00,
  "movementsIncome": 500.00,
  "movementsExpense": 265.00,
  "balance": 2665.00,             // el número que se cuenta contra el cajón

  "expectedQr": 640.00,           // NO entra en balance

  "countedCash": null,            // nulos mientras esté abierta
  "difference": null,
  "closingNotes": null,

  "openedAt": "2026-09-05T13:42:19Z",
  "openedDay": "2026-09-05",      // día boliviano ya resuelto
  "openedBy": "heidy@aircargo.bo",
  "closedAt": null, "closedDay": null, "closedBy": null,

  "shipmentCount": 12,
  "movementCount": 3,

  "byUser":    [ /* quién cobró cuánto, para repartir la diferencia */ ],
  "movements": [ /* ver abajo */ ],
  "shipments": [ /* el detalle de guías cobradas, como antes */ ]
}
```

`GET /cash-register/sessions/{id}` devuelve exactamente la misma forma, y sirve
para ver una caja cerrada del historial.

### Las filas de `movements`

```jsonc
{
  "id": "…",
  "kind": "Expense",
  "amount": 20.00,
  "signedAmount": -20.00,
  "runningBalance": 60.00,
  "description": "taxi al aeropuerto",
  "receiptUrl": null,
  "settledByDriverId": null,
  "settledByDriver": null,
  "settledByDriverName": null,
  "registeredByUserId": "…",
  "registeredBy": "heidy@aircargo.bo",
  "registeredByName": "Heidy",
  "createdAt": "2026-09-05T13:40:45Z",
  "day": "2026-09-05",
  "canEdit": true
}
```

> **`runningBalance` cambió de significado.** Antes arrancaba en el monto
> asignado del fondo y solo arrastraba movimientos. Ahora es **el saldo del
> cajón en el instante de esa fila**: arranca en `openingCash` y suma también
> los cobros en efectivo anteriores al movimiento. Un egreso de las 15:00 se
> resta de lo que había a las 15:00.
>
> Consecuencia a tener presente: **si después del último movimiento entraron
> cobros, la última fila queda por debajo de `balance`**. No es un error, es que
> esa plata entró después. Si en la pantalla eso confunde, la columna se puede
> ocultar cuando hay cobros posteriores.

`canEdit` sigue igual: es `true` solo si la fila la registró quien está mirando
**y** la caja sigue abierta. Todos los admins de la sucursal ven todos los
movimientos.

## 5. Registrar un movimiento

```jsonc
// POST /api/v1/core/cash-register/movements
{
  "kind": "Income",
  "amount": 150,
  "description": "rendición COD del día",
  "settledByDriverId": "0516eb37-…"   // opcional, solo en rendiciones
}

// 201 Created
{
  "id": "…", "cashRegisterSessionId": "…",
  "kind": "Income", "amount": 150,
  "description": "rendición COD del día",
  "settledByDriverId": "0516eb37-…",
  "settledByDriver": "conductor1santacruz@aircargo.bo",
  "registeredBy": "heidy@aircargo.bo",
  "createdAt": "2026-09-05T13:40:55Z",
  "balance": 710.00                   // el cajón ya con este movimiento
}
```

La sucursal **no viaja en el body**: sale del usuario autenticado, y el
movimiento entra a la caja abierta de esa sucursal. Sin caja abierta:
`400 cashregister.session.notopen`.

`PUT` toma el mismo cuerpo y devuelve además `receiptUrl` y `balance`.
`DELETE` devuelve `{ id, balance }`. El recibo sigue igual: `multipart/form-data`
con el campo `receipt`, JPG/PNG/WEBP, hasta 10 MB, reemplaza el anterior.

## 6. Cerrar

```jsonc
// POST /api/v1/core/cash-register/sessions/{id}/close
{ "countedCash": 2665, "closingNotes": null }

// 200 OK
{
  "id": "…", "status": "Closed",
  "openingCash": 700.00,
  "collectedCash": 1730.00,
  "movementsIncome": 500.00,
  "movementsExpense": 265.00,
  "expectedCash": 2665.00,
  "countedCash": 2665,
  "difference": 0.00,
  "expectedQr": 640.00,
  "closingNotes": null,
  "openedAt": "…", "closedAt": "…", "closedBy": "heidy@aircargo.bo",
  "shipmentCount": 12,
  "movementCount": 3
}
```

Con diferencia distinta de cero, `closingNotes` es obligatoria
(`400 cashregister.closingnotes.required`).

**Cerrar es irreversible.** El modal tiene que mostrar los números antes de
confirmar, y conviene que diga que no hay vuelta atrás.

## 7. El listado de cajas

`GET /cash-register/sessions?page&perPage&branchOfficeId&status&dateFrom&dateTo`

Cada fila trae la apertura y los totales de movimientos —que salen sin consulta
extra—, y deja en `null` lo que depende de recalcular los cobros:

```jsonc
{
  "id": "…", "branchOfficeCode": "SCZ-01", "status": "Closed",
  "carriedCash": 710.00, "openingCash": 700.00, "openingDifference": -10.00,
  "openingNotes": "faltaban 10 Bs…",
  "movementsIncome": 500.00, "movementsExpense": 265.00, "movementCount": 3,
  "balance": 2665.00,        // null si la caja sigue abierta
  "expectedQr": 640.00,      // null si sigue abierta
  "countedCash": 2665.00, "difference": 0.00, "closingNotes": null,
  "openedAt": "…", "openedDay": "2026-09-05", "openedBy": "…",
  "closedAt": "…", "closedDay": "2026-09-05", "closedBy": "…"
}
```

**`expectedCash` se renombró a `balance`** para que sea el mismo nombre en las
tres pantallas.

---

# PARTE 2 · La caja es un candado

## 8. Las dos reglas, ya activas

**(a) Sin caja abierta no se emite.** `POST /shipments` y `POST
/shipments/sporadic` fallan con `400 cashregister.session.notopen`. Alcanza a
**todo**: prepago, contraentrega y fiado.

**(b) Cerrada la caja, sus guías se congelan.** `PUT /shipments/{id}` y `POST
/shipments/{id}/annul` fallan con `400 shipment.cashregister.closed` cuando la
guía cayó dentro de una caja ya cerrada de su sucursal de origen **y** movió
plata (`collectedByUserId != null`). Las que no cobraron nada siguen editables.

Para poder ocultar los botones sin adivinar, **el listado de envíos trae un flag
nuevo**:

```jsonc
{ "code": "ESP-000026", "…": "…", "cashRegisterClosed": true }
```

Se resuelve en una sola consulta por página, no cuesta una llamada por fila.

> **Ojo con el superadmin.** El pedido dice "una sesión abierta en la sucursal
> del usuario", y el superadmin no tiene sucursal. Como la regla es *"abrir la
> caja es lo que declara que la sucursal está atendiendo"*, se aplicó **a la
> sucursal de origen resuelta**, sea quien sea el que emite: el superadmin que
> emite en nombre de una sucursal con la caja cerrada también recibe
> `cashregister.session.notopen`. Si se prefiere que el superadmin pase por
> encima, es un `if` y se cambia — pero entonces vuelve a existir el hueco.

## 9. Errores

**Nuevos:**

| `title` | HTTP | Qué hacer |
|---|---|---|
| `cashregister.session.notopen` | 400 | No hay caja abierta. **Ofrecer abrirla.** |
| `shipment.cashregister.closed` | 400 | Guía congelada por su arqueo. Ocultar Editar y Anular. |
| `cashregister.openingnotes.required` | 400 | La apertura no coincide con lo arrastrado. |
| `cashregister.openingnotes.toolong` | 400 | Máximo 300 caracteres. |
| `cashregister.openingcash.invalid` | 400 | La apertura no puede ser negativa. |
| `cashregister.movement.driver.notfound` | 400 | El conductor indicado no existe. |
| `cashregister.movement.driver.invalid` | 400 | El usuario indicado no es conductor. |

**Renombrados** — el prefijo `pettycash.*` ya no existe. Hay que reemplazarlos:

| Antes | Ahora |
|---|---|
| `pettycash.period.notopen` | `cashregister.session.notopen` |
| `pettycash.period.alreadyopen` | `cashregister.session.alreadyopen` |
| `pettycash.period.closed` | `cashregister.session.closed` |
| `pettycash.period.notfound` | `cashregister.session.notfound` |
| `pettycash.movement.notfound` | `cashregister.movement.notfound` |
| `pettycash.movement.amount.invalid` | `cashregister.movement.amount.invalid` |
| `pettycash.movement.description.required` | `cashregister.movement.description.required` |
| `pettycash.movement.description.toolong` | `cashregister.movement.description.toolong` |
| `pettycash.movement.access.notowner` | `cashregister.movement.access.notowner` |
| `pettycash.receipt.*` | `cashregister.receipt.*` |
| `pettycash.access.forbidden` | `cashregister.access.forbidden` |
| `pettycash.user.notfound` | `cashregister.user.notfound` |
| `pettycash.daterange.invalid` | `cashregister.daterange.invalid` |
| `pettycash.assignedamount.invalid` | *(no existe: no hay monto asignado)* |

Se renombraron porque la caja chica dejó de existir como concepto: un error que
dice `pettycash` sobre una pantalla que ya no se llama así envejece mal.

---

# PARTE 3 · El reporte de QR

```
GET /api/v1/core/cash-register/qr-summary
      ?groupBy=Day|Month
      &dateFrom=2026-09-01
      &dateTo=2026-09-30
      &branchOfficeId=…        // opcional; solo lo usa el superadmin
```

```jsonc
// 200 OK
{
  "groupBy": "Day",
  "dateFrom": "2026-09-01",     // el rango efectivamente consultado
  "dateTo": "2026-09-30",
  "data": [
    { "period": "2026-09-04", "branchOfficeId": "…", "branchOfficeCode": "SCZ-01",
      "totalQr": 640.00, "shipmentCount": 12 },
    { "period": "2026-09-05", "branchOfficeId": "…", "branchOfficeCode": "SCZ-01",
      "totalQr": 310.00, "shipmentCount": 6 }
  ],
  "total": 950.00,
  "shipmentCount": 18
}
```

- `groupBy` viaja como texto **`Day`** o **`Month`** (mayúscula inicial, igual
  que el resto de los enums). Con `Month`, `period` es `"2026-09"`.
- **Sin rango, el mes boliviano en curso.** Así una consulta sin filtros no barre
  la tabla entera.
- **El agrupado es por día boliviano**, no por fecha UTC. Verificado: una guía
  creada el `2026-09-05T03:53Z` cae en el período `2026-09-04`.
- Solo guías válidas: una anulada no ingresó plata.
- Alcance: superadmin todas las sucursales, admin la suya. No se creó un rol
  `contador`.

---

# PARTE 4 · El Excel

```
GET /api/v1/core/shipments/export
      ?status=…&validity=…&dateFrom=…&dateTo=…
      &supplierId=…&originBranchOfficeId=…&destinationBranchOfficeId=…
      &manifestId=…&unmanifested=…
```

```
200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="envios-2026-09.xlsx"
```

Sin paginación y **sin tope de filas**. Los filtros y el alcance por rol son
literalmente los mismos que `GET /shipments` —comparten el código— así que lo que
se exporta coincide con lo que se ve.

Un mes completo se nombra `envios-2026-09.xlsx`; cualquier otro rango,
`envios-2026-09-03-a-2026-09-11.xlsx`.

### Las doce columnas

| # | Columna | Tipo en la celda |
|---|---|---|
| 1 | Fecha | fecha, **día boliviano** |
| 2 | Hora | hora, **hora boliviana** |
| 3 | Guía | texto |
| 4 | Cliente | texto |
| 5 | Origen | texto (código de sucursal) |
| 6 | Destino | texto |
| 7 | Estado | texto en castellano |
| 8 | Tipo de Pago | texto en castellano |
| 9 | Medio de Pago | texto en castellano |
| 10 | Peso (kg) | **número** |
| 11 | Costo (Bs) | **número** |
| 12 | Validez | Válida / Anulada |

Se agregó la columna **Validez** que estaba como sugerencia. Peso y costo van
como celdas numéricas de verdad: el `SUMA()` de Excel funciona. La fila de
encabezado va fija y con autofiltro.

### Las traducciones

| Enum | Etiqueta |
|---|---|
| `AtOriginBranch` | En sucursal origen |
| `InManifest` | En manifiesto |
| `InTransit` | En tránsito |
| `AtDestinationBranch` | En sucursal destino |
| `AwaitingCustomerPickup` | Esperando retiro |
| `Assigned` | Asignado a conductor |
| `OutForDelivery` | En reparto |
| `Observed` | Observado |
| `Delivered` | Entregado |
| `Rejected` | Rechazado |
| `Returned` | Devuelto |
| `Prepaid` / `CashOnDelivery` / `OnAccount` | Prepagado / Contra entrega / Cuenta corriente |
| `Cash` / `Qr` / *(nulo)* | Efectivo / QR / **Sin cobro** |
| `Valid` / `Annulled` | Válida / Anulada |

Si alguna etiqueta no es la que usa el negocio, se cambia en un solo lugar
(`SpanishLabels`). **El JSON de las APIs sigue mandando el enum crudo**: ahí del
otro lado hay código, no una persona.

---

## 12. Dos filtros del pedido que no existen

El pedido pide para el export "los mismos filtros que `GET /shipments`" y después
lista `searchTerm` y `direction=outgoing|incoming`.

**Ninguno de los dos existe hoy en `GET /shipments`.** No se inventaron para el
export, porque entonces el archivo podría filtrar distinto que la pantalla, que
es justo lo que hay que evitar. Lo que sí está y cubre `direction` es
`originBranchOfficeId` / `destinationBranchOfficeId`.

Si hacen falta de verdad, se agregan **a los dos** en el mismo cambio. Decir cómo
tiene que buscar `searchTerm` —código, cliente, teléfono— y se hace.

---

## 13. Migración

Ninguna, como se acordó. Las tablas `petty_cash_periods` y
`petty_cash_movements` se borraron en la migración `CajaUnificada`, ya aplicada a
la base de desarrollo (Neon). Las cajas del mostrador que ya existían quedaron
con `carriedCash = 0` y `openingCash = 0`.

En el desplegado la migración entra sola con el redeploy: `Program.cs` corre
`MigrateAsync()` al arrancar el contenedor.

---

## 14. Qué se verificó de punta a punta

Contra la base de desarrollo, con `adminsantacruz@aircargo.bo`:

- Abrir con desvío sin explicación → `cashregister.openingnotes.required`; con
  explicación → 201 con `openingDifference: -10.00`.
- Egreso 20 + ingreso 500 + rendición 150 sobre una caja con Bs 80 cobrados y
  apertura 0 → `balance: 710.00`, y las tres filas con su `runningBalance`
  encadenado (60 → 560 → 710).
- Rendición apuntando a un superadmin → `cashregister.movement.driver.invalid`.
- Cerrar con `countedCash` distinto y sin nota → `cashregister.closingnotes.required`;
  cerrar exacto → `difference: 0.00`.
- Con la caja cerrada: emitir un esporádico → `cashregister.session.notopen`;
  registrar un movimiento → lo mismo.
- `carried` después del cierre → `carriedCash: 710.00`, `hasOpenSession: false`.
- Guía que había entrado al arqueo cerrado: editar y anular →
  `shipment.cashregister.closed`; y en el listado, `cashRegisterClosed: true`
  solo en esa fila.
- `qr-summary` por día y por mes con el corte boliviano correcto.
- Export: 200 con el `Content-Disposition` correcto, encabezados en castellano y
  peso y costo como celdas numéricas.

---

## 15. Lo que sigue sin existir

- **El cobro contra entrega no se registra en la tarea del conductor.** La
  rendición entra al cajón como `Income` con `settledByDriverId`, pero no hay
  contra qué cruzarla: el sistema no sabe cuánto cobró el conductor. Es el hueco
  más grande que queda, y el que le daría sentido completo a la referencia.
- **No hay categorías de gasto**: la descripción es texto libre.
- **No se puede cargar un movimiento a una fecha pasada.** El día sale de cuándo
  se registró: es lo que impide meter gastos en turnos ya arqueados.
- **No se puede desanular** una guía.
- **No hay reabrir**, por decisión del negocio.

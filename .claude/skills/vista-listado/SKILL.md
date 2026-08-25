---
name: vista-listado
description: Convenciones de las pantallas de listado con tabla del panel de AirCargo (órdenes, artículos, envíos, usuarios, recepciones…) y catálogo de componentes reutilizables de la plantilla TailAdmin. Úsala al crear una pantalla de listado nueva o al adaptar una existente - cubre qué componente de la plantilla usar en vez de escribir uno a mano, encabezado sin títulos duplicados, filtros, orden y alineación de columnas, numeración de filas, contadores desde el servidor, acciones condicionales y cómo mostrar la autoría/auditoría (siempre el correo del usuario, nunca el nombre). Dispara con "adaptá esta página al estándar", "aplicá la skill de listado", "leé la skill", o cualquier pedido de emprolijar/alinear una tabla del panel.
---

# Vista de listado — estándar del panel

La referencia viva es **`/proveedor/ordenes`**. Si algo de acá no cierra con lo
que hace esa pantalla, gana esa pantalla y hay que actualizar este documento.

Archivos del ejemplo canónico:

```
src/app/proveedor/ordenes/page.tsx                        estructura y filtros
src/components/proveedor/SupplierOrderDeliveriesTable.tsx  la tabla
src/services/orderDeliveryService.ts                       filtros y getCounts
```

---

## 0. Antes de escribir un control: buscarlo en la plantilla

El proyecto está montado sobre **TailAdmin** (Next.js + Tailwind). La plantilla
trae un set de componentes ya estilados y en modo oscuro. **Escribir un `<input>`
o un `<select>` a mano es la última opción, no la primera** — queda con otro
aspecto que el resto del panel y hay que mantenerlo aparte.

### Inventario

| Necesito | Usar | Dónde |
|---|---|---|
| Fecha / rango de fechas | `DatePicker` (flatpickr, `mode="range"`) | `components/form/date-picker.tsx` |
| Texto, número, email | `InputField` | `components/form/input/InputField.tsx` |
| Texto largo | `TextArea` | `components/form/input/TextArea.tsx` |
| Desplegable | `Select` | `components/form/Select.tsx` |
| Desplegable múltiple | `MultiSelect` | `components/form/MultiSelect.tsx` |
| Teléfono con prefijo | `PhoneInput` | `components/form/group-input/PhoneInput.tsx` |
| Casilla / radio | `Checkbox`, `Radio` | `components/form/input/` |
| Interruptor | `Switch` | `components/form/switch/Switch.tsx` |
| Archivo | `FileInput` | `components/form/input/FileInput.tsx` |
| Etiqueta de campo | `Label` (tiene `required`) | `components/form/Label.tsx` |
| Etiqueta de estado | `Badge` | `components/ui/badge/Badge.tsx` |
| Botón | `Button` | `components/ui/button/Button.tsx` |
| Modal | `Modal` + `useModal()` | `components/ui/modal/`, `hooks/useModal.ts` |
| Pestañas | `Tabs` | `components/ui/tabs/Tabs.tsx` |
| Tabla | `Table`, `TableHeader`, `TableRow`, `TableCell` | `components/ui/table/` |
| Menú contextual | `Dropdown` | `components/ui/dropdown/` |
| Aviso en línea | `Alert` | `components/ui/alert/` |
| Notificación | `useToast()` | `context/ToastContext.tsx` |
| Paginación | `Pagination` | `components/tables/Pagination.tsx` |
| Ícono | `@/icons` (SVG como componente) | `src/icons/index.tsx` |

Antes de inventar un control: `ls src/components/ui/ src/components/form/`.

### Calendarios

`DatePicker` envuelve **flatpickr** y soporta `mode="range"`, que es justo lo que
piden los filtros de fecha. Un `<input type="date">` nativo se ve distinto en
cada navegador y no combina con el resto del panel.

`ShipmentDateRangeFilter` es el ejemplo armado: atajos (Hoy / Semana / Mes) en un
select, y al elegir "Personalizado" aparecen **dos campos sueltos**, Desde y
Hasta.

```tsx
<DatePicker id={fromId} mode="single" defaultDate={value.from}
            onChange={handleFromChange} placeholder="Desde" />
<span>hasta</span>
<DatePicker id={toId} mode="single" defaultDate={value.to}
            onChange={handleToChange} placeholder="Hasta" />
```

**No usar `mode="range"` para filtros.** Se probó y es peor: obliga a hacer dos
clics en el mismo calendario sin nada que lo indique, y para corregir una sola
punta hay que volver a elegir las dos. Dos campos separados se entienden sin
explicación y cada fecha se cambia por su lado. `mode="range"` sirve para elegir
una estadía o un período como un valor único, no para filtrar una tabla.

Dos trampas de `DatePicker` que ya costaron una vuelta:

1. **`id` sin dos puntos.** flatpickr lo usa como selector CSS (`#${id}`) y
   `useId()` de React genera `:r0:`, que rompe el selector. Limpiarlo:
   `useId().replace(/:/g, "")`.
2. **`onChange` tiene que ser estable.** Está en el array de dependencias del
   `useEffect` que monta flatpickr: una función nueva en cada render lo re-monta
   y se pierde lo que el usuario estaba eligiendo. `useCallback([])` leyendo el
   valor actual de un `ref`.

### Fechas hacia la API: nunca `toISOString()`

`toISOString().split('T')[0]` pasa a UTC. En Bolivia (UTC-4) a partir de las
20:00 devuelve **el día siguiente**, así que "hoy" filtraba por mañana toda la
tarde-noche. Usar `toApiDate()` de `src/utils/datetime.ts`, que formatea en hora
local.

---

## 1. Encabezado: un solo título

`PageBreadcrumb` ya imprime el título **dos veces** (como `<h2>` a la izquierda y
en la miga de pan a la derecha). Poner además un `title` en el `ComponentCard` lo
muestra una tercera vez.

```tsx
// ✅
<PageBreadcrumb pageTitle="Órdenes de Entrega" />
<ComponentCard>{/* … */}</ComponentCard>

// ❌ el mismo texto tres veces en la misma pantalla
<PageBreadcrumb pageTitle="Órdenes de Entrega" />
<ComponentCard title="Órdenes de Entrega">
```

`ComponentCard` ya contempla el caso: sin `title` omite el encabezado **y** el
borde superior, así que no queda un hueco.

**Si había un `desc` útil**, súbelo como párrafo debajo del breadcrumb en vez de
inventar un título para poder mostrarlo — el `desc` vive dentro del bloque del
título y desaparece con él:

```tsx
<PageBreadcrumb pageTitle="Órdenes de Entrega" />
<p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
  Solo las órdenes cuyo departamento de origen coincide con el de tu sucursal.
</p>
<ComponentCard>
```

---

## 2. Nada de tarjetas de resumen arriba

Las tres tarjetas grandes tipo "Total X / Total Ventas / Y Atendidas" **se
quitan**. Ocupan la mitad de la pantalla antes de que se vea un solo dato útil, y
las que dicen "(Página actual)" además mienten: suman solo lo visible y el número
cambia al pasar de página.

Lo que aportaban se reemplaza por:

- **el contador de cada pestaña** (§4), que ya dice cuántos hay de cada estado;
- **el filtro de fechas** (§3), que es lo que la gente realmente venía a usar.

Si un total es genuinamente importante, va como contador de pestaña o como una
línea de texto chica — no como una tarjeta de 100px de alto.

---

## 3. Filtros: pestañas + rango de fechas, en una fila

```tsx
<div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
  <Tabs items={statusTabs} value={statusFilter} onChange={handleStatusChange} />
  <ShipmentDateRangeFilter value={dateRange} onChange={handleDateRangeChange} />
</div>
```

- El rango **arranca en hoy**: `useState<DateRange>(() => todayRange())`.
- `ShipmentDateRangeFilter` infiere sola qué opción del select mostrar a partir
  del valor que recibe, así que no hay que sincronizarla a mano.
- **No usar `lastWeekRange()`**: está deprecada y el nombre miente — devuelve hoy,
  no la última semana. Sigue exportada solo porque cinco pantallas la usan como
  valor inicial. Para pantallas nuevas, `todayRange()`.
- Cambiar cualquier filtro **vuelve a la página 1**. Sin eso, filtrar estando en
  la página 4 muestra una tabla vacía.

```tsx
const handleDateRangeChange = (range: DateRange) => {
  setDateRange(range);
  setCurrentPage(1);
};
```

- Los filtros van en un `baseFilters` memoizado que se comparte entre el listado
  **y** los contadores, para que la lista y los números de las pestañas hablen
  siempre del mismo conjunto.

---

## 4. Los datos los filtra y los cuenta el servidor

**Nunca contar filas para mostrar un total.** El backend recorta `perPage`, así
que pedir un "lote grande" y contar en memoria da de menos y sin avisar (fue un
bug real: las pestañas decían 5 + 5 = 10 cuando había 12).

```ts
// ❌ cuenta sobre lo que entró en el lote
count: allOrders.filter((o) => !o.isAttended).length

// ✅ `count` del servidor, independiente de la paginación
count: counts?.pending
```

El patrón es un `getCounts` en el service que pide una fila de cada rama y lee
solo el `count`:

```ts
getCounts: async (filters = {}) => {
  const [pending, attended] = await Promise.all([
    service.getList(1, 1, { ...filters, attentionStatus: 'Unattended' }),
    service.getList(1, 1, { ...filters, attentionStatus: 'Attended' }),
  ]);
  return { total: pending.count + attended.count, pending: pending.count, attended: attended.count };
},
```

**Cuidado al serializar filtros booleanos o de enum**: `if (filters.x)` se traga
el `false` y el `0`. Usar `!== undefined`.

Si un filtro no existe server-side (p. ej. búsqueda por texto), ese es el único
caso que se resuelve en cliente, y el lote se pide **ya filtrado** por todo lo
demás.

---

## 5. La tabla

### Orden de columnas

1. **Nro** — correlativo de la vista
2. **Fecha** — con encabezado que diga cuál fecha es (`Creada el`, no `Fecha`)
3. **Entidad principal** — nombre arriba, dato secundario abajo (teléfono, código)
4. **Columnas de contexto** — destino, proveedor, categoría…
5. **Clasificación** — badges (tipo, condición)
6. **Importe**
7. **Acciones**

No repetir en una columna algo que ya filtra una pestaña. Si hay pestañas de
estado, la columna "Estado" sobra: ese lugar rinde más con un dato operativo
(el teléfono de quien recibe, el stock, etc.).

### Numeración

Cuenta entre páginas — la fila 11 es la 11, no vuelve a 1:

```tsx
const rowOffset = (currentPage - 1) * (perPage ?? items.length);
// …
{items.map((item, index) => (
  <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
    {rowOffset + index + 1}
  </TableCell>
))}
```

Es un correlativo **de la vista**, no un identificador de la fila: si se filtra o
se reordena, cambia. No usarlo como referencia de negocio.

### Alineación

Estas cuatro reglas resuelven casi toda la sensación de "se ve desalineado":

| Regla | Por qué |
|---|---|
| Números a la derecha + `tabular-nums` | Sin esto "Bs 1200.00" y "Bs 90.00" no coinciden en la coma |
| `align-middle` en todas las celdas | Las celdas de una línea flotaban contra las de dos |
| `whitespace-nowrap` en fecha, teléfono, importe, acciones | Evita que se partan en dos renglones a mitad de tabla |
| Badges apilados con `flex-col`, nunca `flex-wrap` en fila | Al lado, un badge extra ensancha la columna solo en algunas filas |

```tsx
{/* ✅ el badge secundario va debajo */}
<div className="flex flex-col items-start gap-1">
  <Badge size="sm" color={…}>Pagada</Badge>
  {item.isExpress && <Badge size="sm" color="error">Expreso</Badge>}
</div>
```

El encabezado tiene que llevar la **misma** alineación que su celda
(`text-right` en el header si la celda va a la derecha).

### Celda de dos niveles

```tsx
<TableCell className="px-5 py-4 align-middle">
  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
    {item.clientFullName}
  </p>
  <a href={`tel:${item.clientPhone}`}
     className="mt-0.5 block font-mono text-xs text-gray-500 hover:text-brand-500 dark:text-gray-400">
    {item.clientPhone}
  </a>
</TableCell>
```

Teléfonos con `tel:`, correos con `mailto:`. Fuentes monoespaciadas
(`font-mono`) para teléfonos, códigos y guías.

### Fechas

Siempre por los helpers de `src/utils/datetime.ts`, nunca `toLocaleDateString`
suelto. Fecha arriba, hora abajo en gris chico:

```tsx
<p className="text-gray-800 text-theme-sm dark:text-gray-300 font-medium">{formatDate(item.createdAt)}</p>
<p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{formatTime(item.createdAt)}</p>
```

### Skeleton y estado vacío

El `colSpan` del estado vacío tiene que coincidir con la cantidad de columnas, y
el `SkeletonRow` con los anchos aproximados de cada una. Los dos se olvidan
siempre al agregar o quitar una columna.

---

## 6. Autoría: siempre el correo, nunca el nombre

En toda la API el "hecho por quién" de auditoría se expone como **correo del
usuario**. Vale para `createdBy`, `attendedByEmail` y cualquier campo de autoría
que se agregue después.

El motivo es que el correo es único por usuario: identifica sin ambigüedad y no
hay que resolver nada contra otra tabla. Dos personas pueden llamarse igual.

```tsx
// mal — el nombre puede repetirse, y varios DTOs ya no lo traen
<p>Creada por {order.userName}</p>

// bien
<p>Creada por {order.createdBy}</p>
```

Al mostrarlo:

- Va **completo**, sin cortar la parte antes del `@`. Si no entra, se trunca por
  CSS con `truncate` + `title={email}`, pero el dato no se recorta a mano: un
  `maria@` deja de identificar si existe la misma casilla en otro dominio.
- Es largo, así que en tablas va como segunda línea gris chica, nunca como
  columna propia.

**No confundir con los nombres de negocio**, que sí son nombres y no se tocan:
`senderFullName`, `clientFullName`, `driverFullName`, `supplierName`. La regla
es solo para autoría.

---

## 7. Acciones: ocultar lo que va a fallar

Si el backend rechaza una operación por el estado de la fila, el botón **no se
muestra**. Ofrecerlo y mostrar un error después es peor que no ofrecerlo.

```tsx
{/* Una orden atendida ya se convirtió en envío: el backend rechaza editarla. */}
{!item.isAttended && (
  <>
    <button onClick={() => onEdit(item.id)}>Editar</button>
    <button onClick={() => onDelete(item.id)}>Eliminar</button>
  </>
)}
```

Las condiciones se acumulan, no se reemplazan: si ya había un `orderType !==
"Sporadic"`, la nueva lo envuelve.

---

## 8. Checklist para adaptar una pantalla

- [ ] Ningún `<input>`/`<select>` escrito a mano donde la plantilla ya tiene uno (§0)
- [ ] El título aparece una sola vez (sacar `title` del `ComponentCard`)
- [ ] Si había `desc`, subirlo como párrafo bajo el breadcrumb
- [ ] Quitar las tarjetas de resumen de arriba
- [ ] Pestañas + `ShipmentDateRangeFilter` en una fila, con hoy por defecto
- [ ] Todo cambio de filtro vuelve a página 1
- [ ] Contadores desde el `count` del servidor, no contando filas
- [ ] Columna `Nro` con `rowOffset`, alineada a la derecha
- [ ] Encabezado de fecha explícito (`Creada el`, `Recibida el`…)
- [ ] Autoría mostrada con el correo (`createdBy`), nunca con el nombre (§6)
- [ ] Sacar la columna que duplica una pestaña; poner un dato operativo
- [ ] Importes a la derecha con `tabular-nums`
- [ ] `align-middle` + `whitespace-nowrap` donde corresponde
- [ ] Badges secundarios apilados, no en fila
- [ ] Acciones ocultas cuando el backend las va a rechazar
- [ ] `colSpan` del vacío y anchos del skeleton actualizados
- [ ] `npx tsc --noEmit` y `npx next build` limpios

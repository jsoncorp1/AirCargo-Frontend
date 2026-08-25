# AirCargo — Leads del formulario de contacto: lo que necesita el front

Pedido del **frontend al backend**. Hoy el formulario público de contacto no
guarda nada y la pantalla interna de "Clientes Potenciales" muestra datos
inventados en el código. Este documento define qué API hace falta para conectar
las dos puntas.

| Parte | Contenido |
|---|---|
| [1](#1--qué-hay-hoy) | Qué existe hoy en el front (y qué está mockeado) |
| [2](#2--los-datos-del-formulario) | Los campos exactos, con tipos y obligatoriedad |
| [3](#3--endpoints-que-necesitamos) | Los 4 endpoints, con request y response |
| [4](#4--leadstatus) | El enum de estados |
| [5](#5--error-keys) | Claves de error esperadas |
| [6](#6--decisiones-que-necesitamos-que-tomen-ustedes) | **Lo que está bloqueado hasta que respondan** |

---

## 1 — Qué hay hoy

### El formulario público

`src/components/public/contacto/ContactForm.tsx`, servido en `/contacto`.

Está completo y validado del lado del cliente, pero **el submit es falso**: un
`setTimeout` de 1200 ms y una pantalla de éxito. No hay ninguna llamada HTTP. Lo
que el usuario escribe se pierde.

### La pantalla interna

`src/app/admin/leads/page.tsx`, en el menú del admin como "Clientes Potenciales".

También es mock: una constante `MOCK_LEADS` con tres filas escritas a mano. El
botón "Exportar a Excel" es otro `setTimeout` con un `alert`.

Muestra estas columnas, y de acá sale lo que necesitamos que devuelva el listado:

| Columna | De dónde sale |
|---|---|
| Fecha | fecha y hora en que se envió el formulario |
| Compañía | nombre de la empresa |
| Contacto | nombre completo, con el correo debajo en letra chica |
| Ciudad | ciudad de la empresa |
| Teléfono | teléfono de la persona de contacto |
| Estado | estado de gestión comercial del lead |

---

## 2 — Los datos del formulario

Tal como están hoy en el componente. La columna "Requerido" es la validación que
el front ya aplica: el botón de enviar queda deshabilitado si falta alguno.

### Datos de la empresa

| Campo (front) | Etiqueta | Tipo | Requerido | Notas |
|---|---|---|---|---|
| `compania` | Nombre de la Compañía | texto libre | **Sí** | |
| `direccion` | Dirección de la compañía | texto libre | **Sí** | |
| `ciudad` | Ciudad | select | **Sí** | Hoy son 3 opciones fijas: `Santa Cruz`, `La Paz`, `Cochabamba`. Ver §6.2 |
| `pais` | País | fijo | — | Siempre `Bolivia`. El input está deshabilitado. Ver §6.3 |

### Persona de contacto

| Campo (front) | Etiqueta | Tipo | Requerido | Notas |
|---|---|---|---|---|
| `nombreCompleto` | Nombre completo | texto libre | **Sí** | |
| `correo` | Correo electrónico | email | **Sí** | Validado con `type="email"` nada más |
| — | Código | select | — | Solo `+591`. **Hoy este campo está roto**: ver §6.4 |
| `telefono` | Teléfono | tel | **Sí** | Sin formato forzado |
| `preguntas` | Preguntas o comentarios | textarea | No | **Máximo 200 caracteres**, con contador visible |

---

## 3 — Endpoints que necesitamos

Todo bajo el prefijo de siempre (`/api/v1/core`), con el mismo sobre de
paginación que el resto (`page`, `perPage`, `totalPages`, `count`, `data`) y el
mismo formato de error (ProblemDetails con `title` = error key).

### 3.1 `POST /leads` → 201 — **público, sin JWT**

Lo llama el formulario de contacto desde la landing. Es el único punto delicado
del pedido: hoy toda la API exige JWT salvo `/auth/login`, y este endpoint tiene
que ser anónimo por definición. Ver §6.1.

```jsonc
{
  "companyName": "Tienda Moda SA",
  "companyAddress": "Av. Cañoto 123",
  "city": "SantaCruz",
  "country": "Bolivia",
  "contactFullName": "María López",
  "contactEmail": "maria@moda.com",
  "contactPhone": "71234567",
  "comments": "Quiero cotizar envíos a La Paz"    // opcional, máx. 200
}
```

Respuesta: alcanza con el eco de lo creado.

```jsonc
{
  "id": "…",
  "companyName": "Tienda Moda SA",
  "status": "New",
  "createdAt": "2026-08-13T12:00:00Z"
}
```

### 3.2 `GET /leads` → 200 — roles: `superadmin`, `admin`

El listado de la pantalla interna.

Query params: `page`, `perPage`, `status`, `city`, `dateFrom`, `dateTo`,
`searchTerm`.

- `searchTerm` debería buscar en nombre de compañía, nombre de contacto y correo.
  **Ojo:** en envíos el `searchTerm` quedó sin implementar del lado del backend y
  el front terminó filtrando solo la página actual, que es un filtro que engaña.
  Acá preferimos que lo haga el servidor o que no exista.
- `dateFrom` / `dateTo` en `yyyy-MM-dd`, ambos extremos inclusive, cubriendo el
  día completo en `dateTo` (igual que en envíos).

```jsonc
{
  "page": 1, "perPage": 10, "totalPages": 3, "count": 27,
  "data": [
    {
      "id": "…",
      "companyName": "Tienda Moda SA",
      "city": "SantaCruz",
      "contactFullName": "María López",
      "contactEmail": "maria@moda.com",
      "contactPhone": "71234567",
      "status": "New",
      "createdAt": "2026-08-13T12:00:00Z"
    }
  ]
}
```

### 3.3 `GET /leads/{id}` → 200 — roles: `superadmin`, `admin`

El detalle completo, para abrir la ficha del lead. Suma a lo del listado:
`companyAddress`, `country`, `comments`, y los datos de gestión:
`assignedToUserId` / `assignedToFullName` si se implementa §6.6,
`statusChangedAt`, `internalNote`.

### 3.4 `PATCH /leads/{id}/status` → 200 — roles: `superadmin`, `admin`

Para mover el lead por el embudo comercial. Hoy la pantalla muestra el estado
pero no tiene forma de cambiarlo; lo vamos a agregar.

```jsonc
{
  "status": "Contacted",
  "internalNote": "Llamé, pidió cotización por escrito"   // opcional
}
```

```jsonc
{
  "id": "…", "status": "Contacted", "statusChangedAt": "2026-08-13T15:00:00Z"
}
```

---

## 4 — `LeadStatus`

Proponemos estos valores, en inglés PascalCase, como todos los enums del sistema
(`ShipmentStatus`, `ManifestStatus`). El front los traduce a etiquetas en
español, igual que hace con los demás.

| Valor | Etiqueta en el front | Cuándo |
|---|---|---|
| `New` | Nuevo | Al crear desde el formulario. Es el estado inicial |
| `Contacted` | Contactado | Un comercial ya se comunicó |
| `Won` | Cerrado (ganado) | Se convirtió en cliente |
| `Lost` | Cerrado (perdido) | No prosperó |

```
New ──→ Contacted ──→ Won
  │          └──→ Lost
  └──→ Lost
```

> La pantalla mock de hoy usa los literales `"Nuevo"`, `"Contactado"` y
> `"Cerrado (Éxito)"` como datos. Eso desaparece: las etiquetas viven en el front
> y el backend manda el enum.

---

## 5 — Error keys

El mapeo de siempre: sufijo `.notfound` → **404**, `.forbidden` → **403**, resto
→ **400**. Las mapeamos en `src/services/apiErrorMessages.ts` apenas las tengamos.

| Key | Cuándo |
|---|---|
| `lead.notfound` | El lead no existe |
| `lead.companyname.required` | Falta el nombre de la compañía |
| `lead.companyaddress.required` | Falta la dirección |
| `lead.city.required` | Falta la ciudad |
| `lead.city.invalid` | La ciudad no es un valor válido del enum |
| `lead.contactfullname.required` | Falta el nombre de contacto |
| `lead.contactemail.required` | Falta el correo |
| `lead.contactemail.invalid` | El correo no tiene formato válido |
| `lead.contactphone.required` | Falta el teléfono |
| `lead.comments.toolong` | Los comentarios pasan de 200 caracteres |
| `lead.statuschange.invalidtransition` | Transición de estado no permitida |
| `lead.daterange.invalid` | `dateFrom` > `dateTo` |
| `lead.ratelimit.exceeded` | Demasiados envíos desde el mismo origen (§6.1) |

---

## 6 — Decisiones que necesitamos que tomen ustedes

Esto es lo que no podemos resolver desde el front. Cada punto cambia el contrato.

### 6.1 El endpoint público y el spam — **lo más importante**

`POST /leads` no puede pedir JWT: lo llama un visitante anónimo de la landing.
Eso abre la primera ruta pública de escritura del sistema, y sin protección se
llena de basura en una semana.

Necesitamos que definan qué van a poner: rate limiting por IP, un captcha (si es
así, cuál, porque hay que integrarlo en el front), o un honeypot. **No lo
implementamos hasta saberlo**, porque si eligen captcha el formulario cambia.

### 6.2 La ciudad: ¿texto libre o enum?

Hoy el select del formulario tiene 3 opciones fijas (`Santa Cruz`, `La Paz`,
`Cochabamba`), pero el sistema ya tiene el enum `BolivianDepartment` con los 9
departamentos, usado en proveedores y sucursales.

**Nuestra recomendación:** reusar `BolivianDepartment`. Evita un segundo
vocabulario de lugares y deja los leads cruzables con las sucursales. Si están de
acuerdo, en el ejemplo de arriba `city` es ese enum (`SantaCruz`, `LaPaz`, …) y
ampliamos el select del formulario a los 9.

### 6.3 El país

El campo está fijo en `Bolivia` y deshabilitado. ¿Guardan igual la columna
pensando en operar fuera de Bolivia más adelante, o la sacamos del contrato y la
agregan cuando haga falta? Nos da lo mismo; solo queremos no mandar un campo que
van a ignorar.

### 6.4 El teléfono y el prefijo `+591`

**Bug del front que vamos a arreglar:** el select de código de país no tiene
`name`, ni `value`, ni `onChange`, así que hoy es decorativo y su valor no forma
parte del estado del formulario. No viaja a ningún lado.

Antes de arreglarlo necesitamos saber cómo lo quieren guardar:

- **a)** un solo campo `contactPhone` con el número tal cual (`71234567`), y el
  prefijo se asume boliviano; o
- **b)** dos campos, `contactPhoneCountryCode` (`+591`) y `contactPhone`.

Si van por (a), lo más limpio es que el select desaparezca del formulario, porque
hoy sugiere una elección que no existe.

### 6.5 Exportar a Excel

El botón existe y es mock. ¿Lo resolvemos en el front generando el archivo desde
los datos que ya tenemos, o prefieren un `GET /leads/export` que devuelva el
`.xlsx` armado?

Nuestra recomendación: **en el front**, si el volumen es de cientos y no de
decenas de miles. Evita una dependencia de generación de archivos en el backend.
Pero necesitaríamos poder pedir la lista completa sin paginar (un `perPage` alto
alcanza).

### 6.6 ¿El lead se asigna a alguien?

El enum de estados asume que alguien gestiona el lead, pero no hay campo de
responsable. ¿Quieren un `assignedToUserId` desde ahora, o el estado alcanza para
esta etapa? Lo preguntamos ahora porque agregarlo después obliga a migrar.

### 6.7 ¿Notificación al recibir un lead?

Cuando entra un lead nuevo, ¿el backend manda un correo a alguien (un buzón
comercial, el admin de la sucursal de esa ciudad)? Si es así es puro backend y el
front no se entera, pero conviene decidirlo junto con el resto.

---

## 7 — Qué hacemos nosotros cuando esto exista

Para que quede claro el reparto de trabajo:

- `src/services/leadService.ts` nuevo, con los DTOs y los 4 métodos.
- `ContactForm.tsx`: reemplazar el `setTimeout` por el `POST` real, con manejo de
  error y el arreglo del select de prefijo (§6.4).
- `src/app/admin/leads/page.tsx`: sacar `MOCK_LEADS`, conectar el listado con
  paginación, filtros de estado y fecha, y agregar el cambio de estado.
- `apiErrorMessages.ts`: mapear las claves `lead.*` a mensajes en español.
- Exportación real a Excel, según lo que se decida en §6.5.

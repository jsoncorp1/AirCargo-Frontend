// Fechas de la app: formato y, sobre todo, ZONA HORARIA.
//
// Regla del sistema, y vale igual para el front y para el backend:
//
//   • Se GUARDA y se TRANSPORTA siempre en UTC (ISO 8601 con `Z`).
//   • Se MUESTRA y se AGRUPA POR DÍA siempre en hora de Bolivia, y escrita.
//
// "Hora local" no sirve como referencia en ninguno de los dos lados: el servidor
// vive en Canadá (UTC-5/-4, y encima con horario de verano) y la del navegador
// depende de cómo tenga configurada la máquina cada usuario. La zona del negocio
// es una sola, no se deduce del entorno: es la constante de abajo.
//
// Del lado del backend el equivalente es `AC.Application/Common/BolivianDate.cs`,
// que interpreta los `dateFrom`/`dateTo` de los listados con esta misma zona.

const LOCALE = 'es-BO';

/** Zona del negocio. Bolivia es UTC-4 fijo: no tiene horario de verano. */
export const BUSINESS_TIME_ZONE = 'America/La_Paz';

const DATE_FMT = new Intl.DateTimeFormat(LOCALE, {
  timeZone: BUSINESS_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const TIME_FMT = new Intl.DateTimeFormat(LOCALE, {
  timeZone: BUSINESS_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

// `yyyy-MM-dd` en la zona del negocio. Se arma por partes en vez de confiar en
// el formato de un locale: `en-CA` suele dar el ISO, pero eso depende del ICU
// que traiga el navegador y acá el formato es un contrato con la API.
const API_DAY_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

// Un `yyyy-MM-dd` suelto JS lo lee como medianoche UTC, o sea las 20:00 del día
// ANTERIOR en Bolivia: mostrarlo corría la fecha un día para atrás. Cuando el
// valor es un día de calendario y no un instante, se lo ancla al mediodía para
// que ninguna conversión de zona lo mueva de casillero.
const parse = (value: string | Date): Date =>
  value instanceof Date
    ? value
    : new Date(CALENDAR_DAY.test(value) ? `${value}T12:00:00Z` : value);

/** `13/08/2026`, hora de Bolivia. Cadena vacía si no hay fecha. */
export const formatDate = (value?: string | Date | null): string =>
  value ? DATE_FMT.format(parse(value)) : '';

/** `08:30 p. m.`, hora de Bolivia. Cadena vacía si no hay fecha. */
export const formatTime = (value?: string | Date | null): string =>
  value ? TIME_FMT.format(parse(value)) : '';

/** `13/08/2026 08:30 p. m.`, hora de Bolivia. Cadena vacía si no hay fecha. */
export const formatDateTime = (value?: string | Date | null): string =>
  value ? `${formatDate(value)} ${formatTime(value)}` : '';

/** `13/08/2026 a las 08:30 p. m.`, para textos corridos. */
export const formatDateTimeLong = (value?: string | Date | null): string =>
  value ? `${formatDate(value)} a las ${formatTime(value)}` : '';

/**
 * `2026-08-13`: el DÍA BOLIVIANO al que pertenece un instante.
 *
 * Es el formato que esperan los filtros `dateFrom`/`dateTo` de la API, que el
 * backend interpreta con esta misma zona. Sirve además para agrupar o comparar
 * registros por día.
 *
 * No usar `toISOString().split('T')[0]`: eso da el día UTC, y en Bolivia (UTC-4)
 * a partir de las 20:00 devuelve el día siguiente. Era el motivo de que lo
 * cargado de noche "no apareciera" hasta el día siguiente.
 */
export const toApiDay = (value: string | Date): string => {
  const parts = API_DAY_FMT.formatToParts(parse(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};

/** El día de hoy en Bolivia, `2026-08-13`. */
export const todayApiDay = (): string => toApiDay(new Date());

/**
 * El día que representa un `Date` armado por un calendario (flatpickr,
 * `<input type="date">`).
 *
 * Se leen sus componentes locales a propósito y NO se convierte de zona: ese
 * objeto es "el casillero que tocó el usuario" a medianoche de su máquina, no un
 * instante. Convertirlo correría la fecha si el navegador no está en Bolivia.
 */
export const calendarDateToApiDay = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * Hoy en Bolivia como `Date` de calendario (mediodía de la máquina), para hacer
 * aritmética de días —inicio de semana, inicio de mes— sin que la zona del
 * navegador cambie de qué día se parte. El resultado se vuelve a pasar a texto
 * con `calendarDateToApiDay`.
 */
export const todayAsCalendarDate = (): Date => {
  const [year, month, day] = todayApiDay().split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

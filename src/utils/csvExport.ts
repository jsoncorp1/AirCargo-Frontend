// Exportación a CSV que Excel abre bien.
//
// Se genera en el navegador a propósito: el backend no tiene endpoint de export
// y agregarle generación de archivos por un listado de cientos de filas no se
// justifica. El listado acepta `perPage=500`, así que una sola llamada alcanza.

import { todayApiDay } from './datetime';

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

// Excel en Windows abre el CSV con la codificación regional salvo que el archivo
// empiece con el BOM de UTF-8. Sin esto, "Cañoto" y "Potosí" salen rotos.
const UTF8_BOM = '﻿';

// Un campo se encierra en comillas si trae separador, comillas o saltos de
// línea; las comillas internas se duplican. Es el escapado de RFC 4180.
function escapeCell(raw: string | number | null | undefined): string {
  const value = raw === null || raw === undefined ? '' : String(raw);
  if (/[";\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Arma el contenido del CSV. Separado de la descarga para poder testearlo.
 *
 * Usa `;` y no `,` porque Excel en configuración regional en español espera
 * punto y coma; con coma mete todo en una sola columna.
 */
export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(';');
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(';'));
  return [header, ...body].join('\r\n');
}

/**
 * Dispara la descarga del archivo en el navegador.
 */
export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const content = UTF8_BOM + buildCsv(rows, columns);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Sin esto el blob queda retenido hasta que se descargue la pestaña.
  URL.revokeObjectURL(url);
}

/** `leads_aircargo_2026-08-13` — el día boliviano, no el UTC ni el del navegador. */
export function timestampedFilename(prefix: string): string {
  return `${prefix}_${todayApiDay()}`;
}

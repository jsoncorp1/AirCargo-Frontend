/**
 * Impresión de la guía en ticket de 8 cm x 20 cm.
 *
 * Las dos pantallas que imprimen —el detalle del envío ("Ver" desde la lista) y
 * la pantalla de éxito del esporádico— pasan por acá para que salga LA MISMA
 * hoja. Antes cada una armaba su propia ventana de impresión y las dos se
 * fueron separando; el formato lo define `ShipmentWaybill` y el papel lo define
 * este archivo, así que no hay dónde volver a divergir.
 *
 * Se imprime en una ventana aparte y no con `window.print()` de la pantalla
 * actual porque la guía convive con modales y con el panel: mandar a imprimir
 * la página entera obliga a esconder todo lo demás a fuerza de `print:hidden`.
 */

/** Copias por guía: una para cada firma más la que se queda en mostrador. */
export const WAYBILL_COPIES = 4;

export type PrintWaybillResult =
  /** La ventana de impresión se abrió. */
  | "ok"
  /** El navegador bloqueó la ventana emergente. */
  | "blocked"
  /** No hay guía renderizada todavía. */
  | "empty";

export function printWaybill(
  container: HTMLElement | null,
  { title, copies = WAYBILL_COPIES }: { title: string; copies?: number }
): PrintWaybillResult {
  if (!container) return "empty";

  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return "blocked";

  // Los estilos de Tailwind viven en la página que abre la ventana; sin
  // copiarlos la guía sale como texto plano sin recuadros ni tipografías.
  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((style) => style.outerHTML)
    .join("\n");

  // `innerHTML` y no `outerHTML`: el contenedor que envuelve a la guía en cada
  // pantalla trae sus propias clases (`hidden` en la pantalla de éxito, un
  // centrado en el modal) que en la hoja impresa no significan nada —o
  // directamente la esconden—.
  const waybillHtml = container.innerHTML;
  const copiesHtml = Array.from(
    { length: Math.max(1, copies) },
    () => `<div class="waybill-copy">${waybillHtml}</div>`
  ).join("\n");

  printWindow.document.write(`<!DOCTYPE html>
    <html>
      <head>
        <title>Guía ${title}</title>
        <base href="${document.baseURI}">
        ${styles}
        <style>
          /*
            OJO con este reset: Tailwind v4 publica sus utilidades dentro de
            \`@layer\`, y una regla sin capa le gana a una con capa aunque su
            especificidad sea menor. Es decir que este \`*\` pisa TODOS los
            márgenes y padding de Tailwind dentro de la guía —\`my-1.5\`, \`mt-6\`,
            \`pt-4\`, hasta el \`mt-auto\` del pie— y por eso lo impreso no se
            espacia igual que lo que se ve en pantalla.

            Se deja así a propósito: el formato del ticket se ajustó a mano
            sobre este comportamiento y hoy entra justo en los 20 cm; sacarlo
            devuelve todos los márgenes de golpe y la guía se va a 277 mm, o
            sea dos hojas por copia. Si algún día se corrige, hay que rehacer el
            alto de toda la guía junto con el cambio.

            Consecuencia práctica: el espaciado que tenga que verse en el papel
            va en \`style\` en línea, no en una clase.
          */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page {
            size: 80mm 200mm;
            margin: 0;
          }
          html, body {
            width: 80mm;
            background: white;
            margin: 0;
            padding: 0;
          }
          /* Forzar impresión de fondos (bg-black y bordes de Tailwind). */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Cada copia en su propio ticket; la última no arrastra hoja en blanco. */
          .waybill-copy { break-after: page; page-break-after: always; }
          .waybill-copy:last-child { break-after: auto; page-break-after: auto; }
        </style>
      </head>
      <body onload="setTimeout(function() { window.print(); window.close(); }, 500)">
        ${copiesHtml}
      </body>
    </html>`);
  printWindow.document.close();
  return "ok";
}

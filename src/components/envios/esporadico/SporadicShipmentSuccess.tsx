import React, { useRef } from "react";
import { Printer } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { CheckCircleIcon } from "@/icons";
import { SporadicShipmentResponse } from "@/services/shipmentService";

interface SporadicShipmentSuccessProps {
  result: SporadicShipmentResponse;
  onReset: () => void;
  waybillElement?: React.ReactNode;
}

export default function SporadicShipmentSuccess({
  result,
  onReset,
  waybillElement,
}: SporadicShipmentSuccessProps) {
  const { showToast } = useToast();
  const waybillRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    try {
      if (!waybillRef.current) return;
      const printWindow = window.open("", "_blank", "width=800,height=900");
      if (!printWindow) {
        showToast("error", "Error", "El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes.");
        return;
      }

      // Obtener los estilos de Tailwind actuales
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((style) => style.outerHTML)
        .join("\n");

      // Tomamos el innerHTML para no incluir el contenedor hidden de esta pantalla
      const waybillHtml = waybillRef.current.innerHTML;

      printWindow.document.write(`<!DOCTYPE html>
        <html>
          <head>
            <title>Guía ${result.code || "envío"}</title>
            ${styles}
            <style>
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
              /* Forzar impresión de fondos */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body onload="setTimeout(function() { window.print(); window.close(); }, 500)">
            ${waybillHtml}
            <div class="page-break"></div>
            ${waybillHtml}
            <div class="page-break"></div>
            ${waybillHtml}
            <div class="page-break"></div>
            ${waybillHtml}
          </body>
        </html>`);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "Hubo un error al preparar la impresión.");
    }
  };

  return (
    <ComponentCard title="Envío Esporádico Registrado">
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 dark:bg-success-500/10 border border-success-100 dark:border-success-500/20 shadow-sm">
          <CheckCircleIcon className="size-8 text-success-500" />
        </div>
        
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold dark:text-gray-400">
            Código de guía generado
          </p>
          <p className="mt-1 text-3xl font-black tracking-wide text-gray-800 dark:text-white/90">
            {result.code}
          </p>
          {result.isExpress && (
            <div className="mt-3 flex justify-center">
              <Badge size="sm" color="warning">Envío Expreso Prioritario</Badge>
            </div>
          )}
        </div>

        <div className="mt-4 grid w-full max-w-lg grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/20 shadow-sm">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total</p>
            <p className="font-bold text-gray-800 text-lg dark:text-white/90">Bs {result.totalPrice.toFixed(2)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Peso</p>
            <p className="font-bold text-gray-800 text-lg dark:text-white/90">{result.totalWeight.toFixed(2)} kg</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Costo Envío</p>
            <p className="font-bold text-gray-800 text-lg dark:text-white/90">Bs {result.shippingPrice.toFixed(2)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Paquetes</p>
            <p className="font-bold text-gray-800 text-lg dark:text-white/90">{result.packageCount}</p>
          </div>
          <div className="col-span-2 sm:col-span-4 mt-2 border-t border-gray-200 dark:border-gray-800 pt-3 text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Descripción de Paquetes</p>
            <p className="font-medium text-gray-700 dark:text-gray-300">{result.packageDescription}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 print:hidden">
          <Button onClick={onReset} className="px-8 shadow-sm hover:shadow-md">
            Registrar Nuevo Envío
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open(`/envios/${result.shipmentId}`, '_blank')} 
            className="px-8 shadow-sm hover:shadow-md"
          >
            Ver Guía Creada
          </Button>
          {waybillElement && (
            <Button
              variant="outline"
              onClick={handlePrint}
              className="px-8 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Imprimir Guía
            </Button>
          )}
        </div>
      </div>

      {waybillElement && (
        <div ref={waybillRef} className="hidden print:hidden">
          {waybillElement}
        </div>
      )}
    </ComponentCard>
  );
}

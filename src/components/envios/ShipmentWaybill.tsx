"use client";

import React from "react";
import Image from "next/image";

// Número fijo del callcenter que se imprime en toda guía, no depende del envío.
const CALLCENTER_PHONE = "67723108";

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  Prepaid: "Pagada",
  CashOnDelivery: "Por Pagar",
};

function formatCreatedBy(createdBy: string): string {
  if (!createdBy || createdBy.toLowerCase() === "system") return "Sistema AirCargo";
  return createdBy;
}

interface WaybillLine {
  articleName: string;
  quantity: number;
  weight: number;
  shippingCost: number;
  unitPrice: number;
}

interface ShipmentWaybillProps {
  code: string;
  originDepartment: string;
  destinationDepartment: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
  clientFullName: string;
  clientPhone: string;
  clientAddress: string;
  deliveryType: string;
  isExpress: boolean;
  packageCount: number;
  packageDescription: string;
  lines: WaybillLine[];
  fecha: string;
  hora: string;
  createdBy: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-black">
      {children}
    </p>
  );
}

// Reproduce el formato de una guía física de envío: angosta (ancho de ticket de 80mm),
// con contrastes altos para impresoras térmicas.
export default function ShipmentWaybill({
  code,
  originDepartment,
  destinationDepartment,
  senderFullName,
  senderPhone,
  senderAddress,
  clientFullName,
  clientPhone,
  clientAddress,
  deliveryType,
  isExpress,
  packageCount,
  packageDescription,
  lines,
  fecha,
  hora,
  createdBy,
}: ShipmentWaybillProps) {
  const totalWeight = lines.reduce((acc, l) => acc + (l.weight || 0), 0);
  const totalShippingCost = lines.reduce((acc, l) => acc + (l.shippingCost || 0), 0);

  return (
    <div className="mx-auto w-[302px] bg-white text-black font-sans pb-4">
      {/* Logo + referencia */}
      <div className="flex flex-col items-center gap-1 px-4 pt-5 pb-3">
        <div className="relative h-12 w-32 grayscale contrast-125 brightness-0">
          <Image src="/images/logo/logoaircargoazul.png" alt="AirCargo" fill className="object-contain" />
        </div>
        <p className="text-[12px] font-bold text-black mt-1">
          Callcenter: {CALLCENTER_PHONE}
        </p>
        {isExpress && (
          <span className="mt-1 inline-block border-2 border-black px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-black">
            ENVÍO EXPRESO
          </span>
        )}
      </div>

      {/* Ruta: origen -> destino */}
      <div className="flex items-center justify-between border-y-2 border-dashed border-black px-4 py-3">
        <div className="text-center w-[40%]">
          <SectionLabel>ORIGEN</SectionLabel>
          <p className="text-[15px] font-black uppercase text-black">{originDepartment || "—"}</p>
        </div>
        <div className="flex-1 text-center font-bold text-black">→</div>
        <div className="text-center w-[40%]">
          <SectionLabel>DESTINO</SectionLabel>
          <p className="text-[15px] font-black uppercase text-black">{destinationDepartment || "—"}</p>
        </div>
      </div>

      {/* Emisor / Destinatario */}
      <div className="space-y-3 px-4 py-3">
        <div>
          <SectionLabel>EMISOR</SectionLabel>
          <p className="text-[13px] font-bold leading-tight uppercase text-black">{senderFullName || "—"}</p>
          <p className="text-[11px] font-medium text-black">{senderPhone || "—"}</p>
          {senderAddress && <p className="text-[11px] font-medium text-black leading-tight">{senderAddress}</p>}
        </div>
        <div>
          <SectionLabel>DESTINATARIO</SectionLabel>
          <p className="text-[13px] font-bold leading-tight uppercase text-black">{clientFullName || "—"}</p>
          <p className="text-[11px] font-medium text-black">{clientPhone || "—"}</p>
          {clientAddress && <p className="text-[11px] font-medium text-black leading-tight">{clientAddress}</p>}
        </div>
      </div>

      {/* Resumen: tipo de entrega, paquetes, peso, costo */}
      <div className="border-y-2 border-dashed border-black py-2 px-4">
        <div className="flex justify-between mb-1">
          <span className="text-[11px] font-bold uppercase">TIPO:</span>
          <span className="text-[11px] font-black uppercase">{DELIVERY_TYPE_LABELS[deliveryType] ?? deliveryType}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-[11px] font-bold uppercase">PAQUETES:</span>
          <span className="text-[11px] font-black uppercase">{packageCount}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-[11px] font-bold uppercase">PESO:</span>
          <span className="text-[11px] font-black uppercase">{totalWeight.toFixed(2)} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] font-bold uppercase">ENVÍO:</span>
          <span className="text-[11px] font-black uppercase">Bs {totalShippingCost.toFixed(2)}</span>
        </div>
      </div>

      {packageDescription && (
        <div className="px-4 py-2 border-b-2 border-dashed border-black">
          <SectionLabel>DESCRIPCIÓN</SectionLabel>
          <p className="text-[11px] font-bold leading-tight text-black">{packageDescription}</p>
        </div>
      )}

      {/* Código de guía */}
      <div className="px-4 py-4 text-center border-b-2 border-dashed border-black">
        <SectionLabel>CÓDIGO DE GUÍA</SectionLabel>
        <p className="mt-1 text-[22px] font-black tracking-widest break-all text-black">{code}</p>
        {/* Placeholder for barcode, since thermal printers do barcodes well, we emulate it with a CSS pattern */}
        <div
          className="mx-auto mt-2 h-8 w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px, #000 8px, #000 12px, transparent 12px, transparent 14px)",
          }}
        />
      </div>

      {/* Detalle del envío, línea por línea */}
      <div className="px-4 py-3">
        <SectionLabel>DETALLE</SectionLabel>
        <table className="mt-1 w-full text-left text-[10px]">
          <thead>
            <tr className="border-b border-black">
              <th className="pb-1 font-bold text-black uppercase">Cant</th>
              <th className="pb-1 font-bold text-black uppercase">Art.</th>
              <th className="pb-1 text-right font-bold text-black uppercase">Bs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/20">
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="py-1 font-bold text-black align-top">{l.quantity}</td>
                <td className="py-1 pr-2 font-bold text-black uppercase leading-tight">{l.articleName}</td>
                <td className="py-1 text-right font-bold text-black align-top">{l.unitPrice?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-black px-4 py-3 text-[10px] text-center font-bold text-black uppercase leading-tight">
        <p>FECHA: {fecha} {hora}</p>
        <p className="mt-0.5">GENERADO POR: {formatCreatedBy(createdBy)}</p>
      </div>
      
      <div className="px-4 text-[9px] text-center font-bold text-black">
        <p>¡GRACIAS POR SU PREFERENCIA!</p>
      </div>
    </div>
  );
}

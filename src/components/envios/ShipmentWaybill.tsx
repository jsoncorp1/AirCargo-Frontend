"use client";

import React from "react";
import Image from "next/image";

// Número fijo del callcenter que se imprime en toda guía, no depende del envío.
const CALLCENTER_PHONE = "67723108";

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  Prepaid: "Pagada",
  CashOnDelivery: "Por Pagar",
};

// El backend todavía no resuelve el usuario real desde el JWT para este campo
// y siempre manda "system" — se muestra como "Sistema AirCargo" en vez del
// valor crudo hasta que el backend empiece a mandar el usuario real.
function formatCreatedBy(createdBy: string): string {
  if (!createdBy || createdBy.toLowerCase() === "system") return "Sistema AirCargo";
  return createdBy;
}

interface WaybillLine {
  articleName: string;
  quantity: number;
  weight: number;
  shippingCost: number;
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
    <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">
      {children}
    </p>
  );
}

function PersonIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// Reproduce el formato de una guía física de envío: angosta (ancho de celular),
// separadores punteados tipo ticket, y pensada para imprimirse tal cual.
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
    <div className="mx-auto w-full max-w-[320px] rounded-2xl border border-gray-300 bg-white text-gray-900 shadow-md">
      {/* Logo + referencia */}
      <div className="flex flex-col items-center gap-1.5 bg-gray-50 px-4 pt-5 pb-4">
        <div className="relative h-14 w-36">
          <Image src="/images/logo/airlogo.jpg" alt="AirCargo" fill className="object-contain" />
        </div>
        <p className="text-[11px] font-semibold tracking-wide text-gray-500">
          Callcenter: {CALLCENTER_PHONE}
        </p>
        {isExpress && (
          <span
            style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
            className="mt-1 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          >
            Envío Expreso
          </span>
        )}
      </div>

      {/* Ruta: origen -> destino */}
      <div className="flex items-center justify-center gap-3 border-t border-dashed border-gray-300 px-4 py-4">
        <div className="text-center">
          <SectionLabel>Origen</SectionLabel>
          <p className="text-sm font-bold uppercase text-gray-800">{originDepartment || "—"}</p>
        </div>
        <svg className="h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        <div className="text-center">
          <SectionLabel>Destino</SectionLabel>
          <p className="text-sm font-bold uppercase text-gray-800">{destinationDepartment || "—"}</p>
        </div>
      </div>

      {/* Emisor / Destinatario */}
      <div className="space-y-3 border-t border-dashed border-gray-300 px-4 py-3">
        <div className="flex gap-2.5">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <PersonIcon />
          </div>
          <div className="min-w-0 flex-1">
            <SectionLabel>Emisor</SectionLabel>
            <p className="break-words text-sm font-medium">{senderFullName || "—"}</p>
            <p className="text-xs text-gray-500">{senderPhone || "—"}</p>
            {senderAddress && <p className="text-xs text-gray-500">{senderAddress}</p>}
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <PinIcon />
          </div>
          <div className="min-w-0 flex-1">
            <SectionLabel>Destinatario</SectionLabel>
            <p className="break-words text-sm font-medium">{clientFullName || "—"}</p>
            <p className="text-xs text-gray-500">{clientPhone || "—"}</p>
            {clientAddress && <p className="text-xs text-gray-500">{clientAddress}</p>}
          </div>
        </div>
      </div>

      {/* Resumen: tipo de entrega, paquetes, peso, costo */}
      <div className="grid grid-cols-2 gap-px border-t border-gray-200 bg-gray-200">
        <div className="bg-white px-3.5 py-2.5">
          <SectionLabel>Tipo de Entrega</SectionLabel>
          <p className="text-xs font-bold text-gray-800">{DELIVERY_TYPE_LABELS[deliveryType] ?? deliveryType}</p>
        </div>
        <div className="bg-white px-3.5 py-2.5">
          <SectionLabel>Paquetes</SectionLabel>
          <p className="text-xs font-bold text-gray-800">{packageCount}</p>
        </div>
        <div className="bg-white px-3.5 py-2.5">
          <SectionLabel>Peso Total</SectionLabel>
          <p className="text-xs font-bold text-gray-800">{totalWeight.toFixed(2)} kg</p>
        </div>
        <div className="bg-white px-3.5 py-2.5">
          <SectionLabel>Costo Envío</SectionLabel>
          <p className="text-xs font-bold text-gray-800">Bs {totalShippingCost.toFixed(2)}</p>
        </div>
      </div>
      {packageDescription && (
        <div className="border-t border-dashed border-gray-300 px-4 py-2">
          <SectionLabel>Descripción de Paquetes</SectionLabel>
          <p className="text-xs text-gray-600">{packageDescription}</p>
        </div>
      )}

      {/* Código de guía */}
      <div className="border-t border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center">
        <SectionLabel>Código de Guía</SectionLabel>
        <p className="mt-1 text-2xl font-extrabold tracking-widest break-all text-brand-700">{code}</p>
        <div
          className="mx-auto mt-3 h-6 w-4/5 opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #111827 0px, #111827 2px, transparent 2px, transparent 4px)",
          }}
        />
      </div>

      {/* Detalle del envío, línea por línea */}
      <div className="border-t border-dashed border-gray-300 px-4 py-3">
        <SectionLabel>Detalle del Envío</SectionLabel>
        <div className="mt-2 space-y-1.5">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex-1 break-all">{line.quantity}x {line.articleName || "Artículo desconocido"}</span>
              <span className="shrink-0 text-gray-500">{line.weight.toFixed(2)} kg</span>
              <span className="shrink-0 font-medium">Bs {line.shippingCost.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pie: quién y cuándo se emitió la guía */}
      <div className="border-t border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-center">
        <p className="text-[10px] text-gray-400">
          Emitida el {fecha || "—"}{hora ? ` a las ${hora}` : ""}
        </p>
        <p className="text-[10px] text-gray-400">
          por {formatCreatedBy(createdBy)}
        </p>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  PaymentType,
  ServicePointType,
  paymentTypeLabel,
  PaymentMethod,
  paymentMethodLabel,
} from "@/services/logisticsEnums";
import type { OrderType } from "@/services/orderDeliveryService";

// Número fijo del callcenter que se imprime en toda guía, no depende del envío.
const CALLCENTER_PHONE = "67723108";
const SITE_URL = "www.aircargo.com";

/**
 * Marca de los campos que el formato de guía pide pero el backend TODAVÍA NO
 * expone: Nit/Ci del remitente, Nit/Ci y correo del destinatario, valor
 * declarado del esporádico y la dirección de la sucursal que emite.
 *
 * Se imprime la etiqueta con esta marca en vez de dejar el renglón vacío para
 * que se vea de un vistazo qué falta cablear cuando el API los agregue: un
 * renglón en blanco se confunde con un dato que el operador no cargó.
 */
const FALTA = "FALTA";

function formatCreatedBy(createdBy: string): string {
  if (!createdBy || createdBy.toLowerCase() === "system") return "Sistema AirCargo";
  return createdBy;
}

// El código ya viene con el prefijo del tipo de orden (`COR-000123` corporativo,
// `ESP-000123` esporádico), así que la guía sabe qué variante imprimir aunque
// quien la renderiza no tenga la orden a mano (el tracking solo tiene el envío).
function isSporadicWaybill(code: string, orderType?: OrderType | null): boolean {
  if (orderType) return orderType === "Sporadic";
  return code.trim().toUpperCase().startsWith("ESP");
}

/**
 * Tipo de envío en la nomenclatura de mostrador: P = puerta, S = sucursal.
 * `P2S` es "sale de un domicilio y lo retiran en mostrador". En la guía va UNO
 * solo —el que corresponde—, no las cuatro combinaciones.
 */
function shipmentTypeCode(
  origin?: ServicePointType | string | null,
  destination?: ServicePointType | string | null
): string {
  // El origen es mostrador salvo que el envío haya nacido de un recojo, así que
  // sin dato la suposición correcta es `Branch`; el destino más común es puerta.
  const side = (value: ServicePointType | string | null | undefined, fallback: ServicePointType) =>
    (value ?? fallback) === "Door" ? "P" : "S";
  return `${side(origin, "Branch")}2${side(destination, "Door")}`;
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
  /** Si no se pasa, se deduce del prefijo del código (ESP-/COR-). */
  orderType?: OrderType | null;
  originDepartment: string;
  originBranchAddress?: string | null;
  destinationDepartment: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
  clientFullName: string;
  clientPhone: string;
  clientAddress: string;
  paymentType: PaymentType | string;
  paymentMethod?: PaymentMethod | string | null;
  // Modalidad de cada punta: juntas arman el tipo de envío (P2P/P2S/S2P/S2S).
  originPointType?: ServicePointType | string | null;
  destinationPointType?: ServicePointType | string | null;
  // Solo se imprimen en la guía corporativa, como en el formato del callcenter.
  destinationLocationUrl?: string | null;
  destinationAddressReference?: string | null;
  isExpress: boolean;
  packageCount: number;
  packageDescription: string;
  lines: WaybillLine[];
  fecha: string;
  hora: string;
  createdBy: string;
}

// ─── Piezas del formato ──────────────────────────────────────────────────────

function Divider() {
  return <div className="my-1.5 border-t border-dashed border-black" />;
}

function Field({
  label,
  value,
  missing = false,
  boldValue = false,
}: {
  label: string;
  value?: string | null;
  missing?: boolean;
  boldValue?: boolean;
}) {
  return (
    <p className="text-[10px] leading-snug text-black break-words">
      <span className="font-bold">{label}:</span>{" "}
      <span className={missing ? "font-bold" : boldValue ? "font-extrabold uppercase text-[11px]" : ""}>{missing ? FALTA : value || ""}</span>
    </p>
  );
}

/** Renglón de dos columnas: rótulo a la izquierda, valor pegado a la derecha. */
function Row({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 leading-snug text-black ${highlight ? 'text-[13px] my-1' : 'text-[10px]'}`}>
      <span className="font-bold uppercase">{label}</span>
      <span className={`text-right ${highlight ? 'font-black' : 'font-bold'}`}>{value}</span>
    </div>
  );
}

/** Renglón punteado para completar a mano (dirección de entrega, condiciones). */
function BlankLine() {
  return <div className="mt-2 border-b border-dotted border-black" />;
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="mt-6 mb-4 flex items-end gap-1">
      <span className="whitespace-nowrap text-[10px] font-bold text-black">{label}:</span>
      <span className="flex-1 border-b border-black" />
    </div>
  );
}

/**
 * QR DE EJEMPLO. Es un dibujo, no un código legible: se reemplaza por el QR real
 * cuando se decida la librería —y apunta a distinto lugar según la variante: la
 * ubicación de entrega en la corporativa, el contrato en la esporádica—. Se arma
 * con un patrón fijo (sin azar) para que no cambie entre renders ni entre lo que
 * se ve en pantalla y lo que sale impreso.
 */
function PlaceholderQr({ size = 78 }: { size?: number }) {
  const modules = 21;
  const cells: React.ReactElement[] = [];

  const inBox = (r: number, c: number, r0: number, c0: number) =>
    r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      const finder =
        inBox(r, c, 0, 0) || inBox(r, c, 0, modules - 7) || inBox(r, c, modules - 7, 0);

      let on: boolean;
      if (finder) {
        // Ojo de posicionamiento: marco de 7x7 con un cuadrado de 3x3 adentro.
        const rr = r < 7 ? r : r - (modules - 7);
        const cc = c < 7 ? c : c - (modules - 7);
        const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
        const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
        on = edge || core;
      } else {
        on = (r * 7 + c * 13 + ((r * c) % 5)) % 3 === 0;
      }

      if (on) {
        cells.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#000" />);
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${modules} ${modules}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR de ejemplo"
    >
      <rect x={0} y={0} width={modules} height={modules} fill="#fff" />
      {cells}
    </svg>
  );
}

// ─── Guía ────────────────────────────────────────────────────────────────────

/**
 * Guía de envío en el formato del callcenter, para ticket de 8 cm x 20 cm.
 *
 * Hay DOS variantes de la misma hoja y las separa el tipo de orden:
 *   esporádico  → valor declarado, detalle SIN precios y términos del contrato
 *                 (con el QR que lleva al contrato completo); el total es lo
 *                 que el cliente paga por el envío.
 *   corporativo → ubicación y observación del destinatario, detalle CON precio
 *                 por artículo y bloque de ubicación de entrega con QR. El
 *                 total es la mercadería, que es lo que se cobra contra la
 *                 guía: el flete no aparece acá, se le descuenta a la empresa
 *                 cuando AirCargo le liquida.
 */
export default function ShipmentWaybill({
  code,
  orderType,
  originDepartment,
  originBranchAddress,
  destinationDepartment,
  senderFullName,
  senderPhone,
  senderAddress,
  clientFullName,
  clientPhone,
  clientAddress,
  paymentType,
  paymentMethod,
  originPointType,
  destinationPointType,
  destinationLocationUrl,
  destinationAddressReference,
  isExpress,
  packageCount,
  packageDescription,
  lines,
  fecha,
  hora,
  createdBy,
}: ShipmentWaybillProps) {
  const isSporadic = isSporadicWaybill(code, orderType);

  const totalWeight = lines.reduce((acc, l) => acc + (l.weight || 0), 0);
  const totalShippingCost = lines.reduce((acc, l) => acc + (l.shippingCost || 0), 0);
  const totalGoods = lines.reduce(
    (acc, l) => acc + (l.unitPrice || 0) * (l.quantity || 0),
    0
  );

  return (
    <div
      className="bg-white font-sans text-black"
      style={{
        width: "80mm",
        minHeight: "200mm",
        padding: "4mm",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Encabezado: marca, callcenter y dirección de la sucursal que emite */}
      <div className="flex flex-col items-center">
        <img
          src="/images/logo/logoaircargoazul.png"
          alt="AirCargo"
          style={{
            height: "34px",
            width: "auto",
            maxWidth: "150px",
            filter: "grayscale(100%) contrast(1.25)",
          }}
        />
        <p className="mt-1 text-[10px] font-bold text-black">Callcenter: {CALLCENTER_PHONE}</p>
        {isExpress && (
          <span className="mt-1 inline-block border-2 border-black px-2 text-[9px] font-extrabold uppercase tracking-widest text-black">
            Envío expreso
          </span>
        )}
      </div>

      {/* La dirección de la sucursal emisora viaja como originBranchAddress si está en el backend */}
      <div className="mt-2">
        <Field label="Direccion" value={originBranchAddress || "-"} />
      </div>

      <Divider />

      {/* Código de guía: uno solo, ESP- o COR- según de dónde salió el envío */}
      <p className="break-all text-center text-[15px] font-black tracking-widest text-black">
        {code || "—"}
      </p>

      <Divider />

      {/* Remitente */}
      <div>
        <Field label="Remitente" value={senderFullName} boldValue />
        <Field label="Nit/Ci" value="-" />
        <Field label="Telefono" value={senderPhone} />
        {senderAddress && <Field label="Direccion" value={senderAddress} />}
      </div>

      {/* Destinatario */}
      <div className="mt-2">
        <Field label="Destinatario" value={clientFullName} boldValue />
        <Field label="Nit/Ci" value="-" />
        <Field label="Telefono" value={clientPhone} />
        <Field label="Email" value="-" />
        {!isSporadic && (
          <>
            <Field label="Ubicacion" value={destinationLocationUrl || clientAddress} />
            <Field label="Observacion" value={destinationAddressReference} />
          </>
        )}
      </div>

      <Divider />

      {/* Ruta */}
      <p className="text-center text-[11px] font-black uppercase text-black">
        {originDepartment || "—"} &rarr; {destinationDepartment || "—"}
      </p>

      <Divider />

      {/* Resumen de la carga */}
      <div>
        {isSporadic && <Row label="Valor declarado" value={`${totalGoods.toFixed(2)} Bs`} />}
        <Row label="Peso/vol" value={`${totalWeight.toFixed(2)} kg`} highlight />
      </div>

      <table className="mt-1.5 w-full text-left text-[10px] text-black">
        <thead>
          <tr className="border-b border-black">
            <th className="w-[20%] pb-0.5 font-bold uppercase">Pieza</th>
            <th className="pb-0.5 font-bold uppercase">Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="pt-0.5 align-top font-bold">{packageCount}</td>
            <td className="pt-0.5 font-bold leading-snug">{packageDescription || "—"}</td>
          </tr>
        </tbody>
      </table>

      <Divider />

      {/* Detalle: el corporativo lleva el precio de cada artículo, el esporádico no */}
      <p className="text-[10px] font-bold uppercase text-black">Detalle de la guia</p>
      <table className="mt-1 w-full text-left text-[10px] text-black">
        <thead>
          <tr className="border-b border-black">
            <th className="w-[18%] pb-0.5 font-bold uppercase">Cant</th>
            <th className="pb-0.5 font-bold uppercase">Descripcion</th>
            {!isSporadic && (
              <th className="w-[26%] pb-0.5 text-right font-bold uppercase">Precio</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/20">
          {lines.map((l, i) => (
            <tr key={i}>
              <td className="py-0.5 align-top font-bold">{l.quantity}</td>
              <td className="py-0.5 pr-1 font-bold leading-snug">{l.articleName}</td>
              {!isSporadic && (
                <td className="py-0.5 text-right align-top font-bold">
                  {((l.unitPrice || 0) * (l.quantity || 0)).toFixed(2)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <Divider />

      {/*
        El total dice cosas distintas según la variante:
        esporádico  → lo que el cliente paga por el envío;
        corporativo → la mercadería, que es lo que se cobra contra esta guía. El
        flete NO va acá: se le descuenta a la empresa cuando
        AirCargo le liquida (orden 1500 con envío 100 → 1400).
      */}
      <Row
        label={isSporadic ? "Total precio de envio" : "Total productos"}
        value={`${(isSporadic ? totalShippingCost : totalGoods).toFixed(2)} Bs`}
        highlight
      />

      <Divider />

      {/* Tipo de guía y de envío: solo el valor que corresponde, no el menú */}
      <Row label="Tipo de guia" value={paymentTypeLabel(paymentType)} />
      {paymentType === "Prepaid" && paymentMethod && (
        <Row label="Tipo de pago" value={paymentMethodLabel(paymentMethod)} />
      )}
      <Row
        label="Tipo de envio"
        value={shipmentTypeCode(originPointType, destinationPointType)}
      />

      <Divider />

      {/*
        Bloque libre. Las dos variantes llevan QR, pero apuntan a cosas
        distintas: en el corporativo a la UBICACIÓN de entrega, en el
        esporádico al CONTRATO —los términos completos no entran en 8 cm de
        ancho, así que el ticket solo deja el enlace y unos renglones—.
      */}
      {isSporadic ? (
        <div className="flex flex-col items-center text-center w-full">
          <p className="text-[10px] font-bold uppercase text-black mb-2">
            Terminos y condiciones del contrato
          </p>
          <div className="shrink-0 mb-2">
            <PlaceholderQr />
          </div>
          <div className="w-full">
            <BlankLine />
            <BlankLine />
            <BlankLine />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-bold uppercase text-black">Ubicacion de entrega</p>
          <div className="mt-1 flex items-start gap-2">
            <div className="shrink-0">
              <PlaceholderQr />
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-[10px] font-bold leading-snug text-black">
                {clientAddress || ""}
              </p>
              <BlankLine />
              <BlankLine />
              <BlankLine />
            </div>
          </div>
        </div>
      )}

      <Divider />

      {/* Datos de entrega: se completan a mano al momento de entregar */}
      <p className="text-center text-[10px] font-bold uppercase text-black">Datos de entrega</p>
      <div className="mt-1 flex items-end gap-1">
        <span className="whitespace-nowrap text-[10px] font-bold text-black">
          Fecha de entrega:
        </span>
        <span className="flex-1 border-b border-black" />
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="whitespace-nowrap text-[10px] font-bold text-black">
          Hora de entrega:
        </span>
        <span className="flex-1 border-b border-black" />
      </div>

      <Divider />

      {/* Firmas */}
      <div className="flex-1 flex flex-col justify-end">
        <br />
        <SignatureLine label="Firma remitente" />
        <br />
        <SignatureLine label="Firma de AirCargo" />
        <br />
        <SignatureLine label="Firma de Destinatario" />
        <br />
      </div>

      {/* Pie: se empuja al final de los 20 cm */}
      <div className="mt-auto pt-4 text-center text-[9px] font-bold text-black">
        <p>
          Emitida: {fecha} {hora}
        </p>
        <p className="mt-1">Guia generada por: {formatCreatedBy(createdBy)}</p>
        <p className="mt-1">{SITE_URL}</p>
        <p className="mt-1 uppercase tracking-widest">Guia Original</p>
      </div>
    </div>
  );
}

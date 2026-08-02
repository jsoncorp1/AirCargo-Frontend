"use client";

import React, { forwardRef } from "react";
import { Shipment, SHIPMENT_STATUS_LABELS } from "@/services/shipmentService";
import { Package, MapPin, Hash, User, Phone, Map, DollarSign, Weight, Calendar } from "lucide-react";
import Image from "next/image";

interface ShipmentLetterPdfProps {
  envio: Shipment;
}

// Usamos forwardRef para poder capturar este componente con html2canvas
const ShipmentLetterPdf = forwardRef<HTMLDivElement, ShipmentLetterPdfProps>(
  ({ envio }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[816px] min-h-[1056px] bg-white text-black font-sans relative p-12"
      >
        {/* Cabecera / Header */}
        <div className="flex justify-between items-start border-b-4 border-[#040F21] pb-6 mb-8">
          <div>
            <div className="h-12 mb-2 flex items-center">
              <img 
                src="/images/logo/logoaircargoazul.png" 
                alt="AirCargo Logo" 
                style={{ height: "48px", width: "auto", maxWidth: "200px" }} 
              />
            </div>
            <h1 className="text-xl font-black text-[#040F21] mt-1 uppercase tracking-wide">
              Documento de Envío
            </h1>
            <p className="text-sm font-semibold text-gray-500 flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" /> 
              {new Date(envio.createdAt).toLocaleString()}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">CÓDIGO DE GUÍA</p>
            <div className="bg-[#040F21] text-white px-4 py-2 rounded font-mono text-xl font-bold tracking-widest inline-block shadow-sm">
              {envio.code}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-2">ID: {envio.waybillNumber}</p>
            <div className="mt-2 text-sm font-bold inline-block px-3 py-1 rounded bg-gray-100 border border-gray-300">
              ESTADO: <span className="uppercase">{SHIPMENT_STATUS_LABELS[envio.status] ?? envio.status}</span>
            </div>
          </div>
        </div>

        {/* Cajas de Origen y Destino */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          {/* Origen */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 relative">
            <div className="absolute -top-3 left-4 bg-[#040F21] text-white text-xs font-bold px-3 py-1 uppercase rounded">
              Origen
            </div>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <MapPin className="w-6 h-6 text-[#040F21]" />
              <div>
                <h3 className="font-black text-xl text-[#040F21] uppercase">
                  {envio.originBranchOfficeCity || envio.originDepartment}
                </h3>
                <p className="text-sm text-gray-500 font-semibold">{envio.originBranchOfficeCode}</p>
              </div>
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-bold">Remitente:</span> {envio.senderFullName}
              </p>
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="font-bold">Teléfono:</span> {envio.senderPhone}
              </p>
            </div>
          </div>

          {/* Destino */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 relative">
            <div className="absolute -top-3 left-4 bg-[#FF7A00] text-white text-xs font-bold px-3 py-1 uppercase rounded">
              Destino
            </div>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <MapPin className="w-6 h-6 text-[#FF7A00]" />
              <div>
                <h3 className="font-black text-xl text-[#040F21] uppercase">
                  {envio.destinationBranchOfficeCity || envio.destinationDepartment}
                </h3>
                <p className="text-sm text-gray-500 font-semibold">{envio.destinationBranchOfficeCode}</p>
              </div>
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-bold">Destinatario:</span> {envio.clientFullName}
              </p>
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <Map className="w-4 h-4 text-gray-500" />
                <span className="font-bold">Dirección:</span> {envio.clientAddress}
              </p>
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="font-bold">Teléfono:</span> {envio.clientPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de Paquetes */}
        <div className="mb-8">
          <h2 className="text-lg font-black text-[#040F21] border-b-2 border-gray-200 pb-2 mb-4 uppercase">
            Detalle de la Carga
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded flex flex-col items-center justify-center py-4">
              <Package className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs font-bold text-gray-500 uppercase">Total Bultos</span>
              <span className="text-xl font-black text-[#040F21]">{envio.packageCount}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded flex flex-col items-center justify-center py-4">
              <Weight className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs font-bold text-gray-500 uppercase">Peso Total</span>
              <span className="text-xl font-black text-[#040F21]">{envio.totalWeight.toFixed(2)} kg</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded flex flex-col items-center justify-center py-4">
              <DollarSign className="w-6 h-6 text-[#FF7A00] mb-1" />
              <span className="text-xs font-bold text-gray-500 uppercase">Costo de Envío</span>
              <span className="text-xl font-black text-[#040F21]">Bs {envio.shippingPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Descripción / Contenido:</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">
              {envio.packageDescription || "Sin descripción detallada."}
            </p>
          </div>

          {/* Tabla de Artículos */}
          {envio.details && envio.details.length > 0 && (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#040F21] text-white">
                  <th className="py-2 px-4 font-bold uppercase text-xs w-16 text-center">Cant</th>
                  <th className="py-2 px-4 font-bold uppercase text-xs">Artículo</th>
                  <th className="py-2 px-4 font-bold uppercase text-xs w-24 text-right">Peso</th>
                  <th className="py-2 px-4 font-bold uppercase text-xs w-32 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 border border-gray-200">
                {envio.details.map((art, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-3 px-4 text-center font-bold">{art.quantity}</td>
                    <td className="py-3 px-4 text-gray-800 font-semibold">{art.articleName}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{art.weight} kg</td>
                    <td className="py-3 px-4 text-right font-bold">Bs {art.shippingCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Firmas */}
        <div className="absolute bottom-12 left-12 right-12">
          <div className="flex justify-between border-t-2 border-gray-200 pt-12 mt-12 px-12">
            <div className="text-center w-48">
              <div className="border-b border-black mb-2"></div>
              <p className="text-xs font-bold text-gray-500 uppercase">Firma Remitente</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-black mb-2"></div>
              <p className="text-xs font-bold text-gray-500 uppercase">Firma Destinatario</p>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 font-medium mt-10">
            Gracias por confiar en AirCargo. Para más información o consultas sobre su envío, visite nuestra web.
          </p>
        </div>
      </div>
    );
  }
);

ShipmentLetterPdf.displayName = "ShipmentLetterPdf";

export default ShipmentLetterPdf;

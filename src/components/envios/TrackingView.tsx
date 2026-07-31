"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import {
  shipmentService,
  Shipment,
  SHIPMENT_STATUS_LABELS,
  ShipmentStatus
} from "@/services/shipmentService";
import { Package, MapPin, CheckCircle2, ChevronRight, Hash, Phone, User, Weight, DollarSign } from "lucide-react";
import Image from "next/image";

export default function TrackingView() {
  const params = useParams();
  const router = useRouter();
  const envioId = params.id as string;

  const [envio, setEnvio] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await shipmentService.getShipmentById(envioId);
      setEnvio(data);
    } catch (error) {
      console.error("Error fetching shipment", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [envioId]);

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando detalles...</div>;
  if (!envio) return <div className="p-10 text-center text-error-500">Envío no encontrado.</div>;

  // Real Backend States Timeline
  const timelineStates: ShipmentStatus[] = ["Pending", "InTransit", "Delivered"];
  // If state is Observed/Rejected/Returned, we insert it after InTransit dynamically or replace Delivered
  let activeStates = [...timelineStates];

  if (envio.status === "Observed") {
    activeStates = ["Pending", "InTransit", "Observed"];
  } else if (envio.status === "Rejected") {
    activeStates = ["Pending", "InTransit", "Rejected"];
  } else if (envio.status === "Returned") {
    activeStates = ["Pending", "InTransit", "Returned"];
  }

  const currentStateIndex = activeStates.indexOf(envio.status) !== -1 ? activeStates.indexOf(envio.status) : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* LEFT COLUMN: TIMELINE */}
      <div className="lg:col-span-1">
        <ComponentCard title="Estado del Envío">
          <div className="p-5">
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-8 pb-4">

              {activeStates.map((st, index) => {
                const isCompleted = currentStateIndex >= index;
                const isCurrent = currentStateIndex === index;

                let dotColor = "bg-gray-200 dark:bg-gray-700";
                let textColor = "text-gray-400";
                let borderColor = "ring-white dark:ring-gray-900";

                if (isCompleted) {
                  if (st === "Observed" || st === "Rejected" || st === "Returned") {
                    dotColor = "bg-error-500";
                    textColor = "text-error-500";
                  } else {
                    dotColor = "bg-brand-500";
                    textColor = "text-brand-500";
                  }
                }
                if (isCurrent) {
                  borderColor = st === "Observed" || st === "Rejected" || st === "Returned"
                    ? "ring-error-100 dark:ring-error-900/30"
                    : "ring-brand-100 dark:ring-brand-900/30";
                }

                return (
                  <div key={st} className="relative pl-8">
                    <span className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ${borderColor} ${dotColor} transition-colors duration-300`}>
                      {isCompleted && <CheckCircle2 className="size-3 text-white" />}
                    </span>
                    <h4 className={`font-semibold text-sm transition-colors duration-300 ${isCurrent ? textColor : isCompleted ? "text-gray-800 dark:text-white" : "text-gray-400"}`}>
                      {SHIPMENT_STATUS_LABELS[st]}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {isCompleted ? (isCurrent ? "Estado actual" : "Completado") : "Pendiente"}
                    </p>
                    {isCurrent && envio.observation && (
                      <p className="text-xs text-error-500 mt-2 bg-error-50/50 p-2 rounded border border-error-100 dark:bg-error-500/10 dark:border-error-500/20">
                        Obs: {envio.observation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* RIGHT COLUMN: INFO */}
      <div className="lg:col-span-2 space-y-6">

        {/* ROUTE SUMMARY */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden p-2">
                <Image
                  src="/images/logo/logoaircargoazul.png"
                  alt="AirCargo Logo"
                  fill
                  className="object-contain p-1 dark:hidden"
                />
                <Image
                  src="/images/logo/logoaircargoblanco.png"
                  alt="AirCargo Logo"
                  fill
                  className="object-contain p-1 hidden dark:block"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Envío {envio.code}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Hash className="w-4 h-4" /> {envio.waybillNumber}
                  <span className="text-gray-300">|</span>
                  {new Date(envio.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
              Volver
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            <div className="flex gap-4">
              <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 dark:bg-brand-500/10">
                <MapPin className="size-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Origen</p>
                <p className="font-semibold text-gray-800 dark:text-white text-lg leading-tight">{envio.originBranchOfficeCity || envio.originDepartment}</p>
                <p className="text-sm text-gray-500 mt-1">{envio.originBranchOfficeCode || "Sucursal Origen"}</p>

                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> {envio.senderFullName}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> {envio.senderPhone}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex absolute left-1/2 top-4 -ml-4 items-center justify-center text-gray-300 dark:text-gray-600">
              <ChevronRight className="w-8 h-8" />
            </div>

            <div className="flex gap-4">
              <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-success-50 flex items-center justify-center text-success-500 dark:bg-success-500/10">
                <MapPin className="size-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Destino</p>
                <p className="font-semibold text-gray-800 dark:text-white text-lg leading-tight">{envio.destinationBranchOfficeCity || envio.destinationDepartment}</p>
                <p className="text-sm text-gray-500 mt-1">{envio.destinationBranchOfficeCode || "Sucursal Destino"}</p>
                <p className="text-sm text-gray-500 mt-1">{envio.clientAddress}</p>

                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> {envio.clientFullName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PACKAGE DETAILS */}
        <ComponentCard title="Detalle de Carga">
          <div className="p-5">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 flex flex-wrap gap-6 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <Package className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Bultos</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{envio.packageCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <Weight className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Peso Total</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{envio.totalWeight.toFixed(2)} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg shadow-sm border border-brand-100 dark:border-brand-500/20">
                  <DollarSign className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Costo de Envío</p>
                  <p className="font-bold text-lg text-brand-600 dark:text-brand-400">Bs {envio.shippingPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Descripción / Contenido:</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              {envio.packageDescription || "Sin descripción detallada."}
            </p>

            {envio.details && envio.details.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Artículos:</p>
                <ul className="space-y-3">
                  {envio.details.map((art, idx) => (
                    <li key={idx} className="flex items-center justify-between border border-gray-100 bg-white p-3 rounded-xl dark:border-gray-800 dark:bg-gray-800/20">
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{art.articleName}</span>
                        <p className="text-xs text-gray-500 mt-1">Peso: {art.weight}kg</p>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-gray-700">
                          Cant: {art.quantity}
                        </span>
                        <p className="text-xs text-brand-500 font-medium mt-1">Bs {art.shippingCost.toFixed(2)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {envio.deliveryComment && (
              <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Comentarios de entrega:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{envio.deliveryComment}"</p>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}

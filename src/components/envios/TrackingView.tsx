"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import AvatarText from "@/components/ui/avatar/AvatarText";
import { Envio, EnvioEstado } from "@/data/mock/envios";
import { Empresa } from "@/data/mock/empresas";
import { Conductor } from "@/data/mock/conductores";
import { Articulo } from "@/data/mock/articulos";
import { envioService } from "@/services/envioService";
import { empresaService } from "@/services/empresaService";
import { conductorService } from "@/services/conductorService";
import { articuloService } from "@/services/articuloService";
import { BoxIcon, CheckCircleIcon, CalenderIcon, BoxCubeIcon, UserIcon } from "@/icons";

export default function TrackingView() {
  const params = useParams();
  const router = useRouter();
  const envioId = params.id as string;

  const [envio, setEnvio] = useState<Envio | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [conductor, setConductor] = useState<Conductor | null>(null);
  const [articulos, setArticulos] = useState<{ nombre: string; cantidad: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const data = await envioService.getEnvioById(envioId);
    if (!data) {
      setLoading(false);
      return;
    }

    setEnvio(data);

    const [emp, cond] = await Promise.all([
      empresaService.getEmpresaById(data.empresaId),
      data.conductorId ? conductorService.getConductorById(data.conductorId) : Promise.resolve(null),
    ]);
    setEmpresa(emp || null);
    setConductor(cond || null);

    // Fetch articulos
    const artIds = data.articulos.map(a => a.articuloId);
    const allArts = await articuloService.getArticulos();
    const mappedArts = data.articulos.map(a => {
      const dbArt = allArts.find(x => x.id === a.articuloId);
      return {
        nombre: dbArt ? dbArt.nombre : "Artículo Desconocido",
        cantidad: a.cantidad
      };
    });
    setArticulos(mappedArts);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [envioId]);

  const advanceState = async () => {
    if (!envio) return;
    
    let nextState: EnvioEstado;
    let assignConductorId = envio.conductorId;

    if (envio.estado === "Pendiente") {
      nextState = "Asignado";
      // Auto-assign first available driver for demo purposes if none
      if (!assignConductorId) {
        const disponibles = await conductorService.getConductoresDisponibles();
        if (disponibles.length > 0) {
          assignConductorId = disponibles[0].id;
        } else {
          alert("No hay conductores disponibles para asignar.");
          return;
        }
      }
    } else if (envio.estado === "Asignado") {
      nextState = "En Camino";
      if (assignConductorId) {
        await conductorService.updateConductor(assignConductorId, { estado: "En Ruta" });
      }
    } else if (envio.estado === "En Camino") {
      nextState = "Entregado";
      if (assignConductorId) {
        await conductorService.updateConductor(assignConductorId, { estado: "Disponible" });
      }
    } else {
      return;
    }

    await envioService.updateEnvio(envioId, { 
      estado: nextState, 
      conductorId: assignConductorId 
    });
    
    await fetchData(); // recargar
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando detalles...</div>;
  if (!envio) return <div className="p-10 text-center text-error-500">Envío no encontrado.</div>;

  const states = ["Pendiente", "Asignado", "En Camino", "Entregado"];
  const currentStateIndex = states.indexOf(envio.estado);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* COLUMNA IZQUIERDA: TIMELINE */}
      <div className="lg:col-span-1">
        <ComponentCard title="Estado del Envío">
          <div className="p-5">
            <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-8">
              
              {states.map((st, index) => {
                const isCompleted = currentStateIndex >= index;
                const isCurrent = currentStateIndex === index;
                return (
                  <div key={st} className="relative pl-6">
                    <span className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900 ${
                      isCompleted ? "bg-brand-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-transparent"
                    }`}>
                      {isCompleted && <CheckCircleIcon className="size-3" />}
                    </span>
                    <h4 className={`font-semibold text-sm ${isCurrent ? "text-brand-500" : isCompleted ? "text-gray-800 dark:text-white" : "text-gray-400"}`}>
                      {st}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {isCompleted ? "Completado" : "Pendiente"}
                    </p>
                  </div>
                );
              })}
            </div>

            {envio.estado !== "Entregado" && envio.estado !== "Cancelado" && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <Button onClick={advanceState} className="w-full">
                  Avanzar a {states[currentStateIndex + 1]}
                </Button>
                <p className="text-xs text-gray-400 mt-3 italic">Botón de administrador para simulación</p>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* COLUMNA DERECHA: INFO */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* RESUMEN RUTA */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Envío #{envio.id}</h3>
              <p className="text-sm text-gray-500">{new Date(envio.fechaCreacion).toLocaleString()}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/envios")}>Volver a Lista</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="flex gap-4">
               <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 dark:bg-brand-500/10">
                 <BoxIcon className="size-5" />
               </div>
               <div>
                 <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Origen</p>
                 <p className="font-medium text-gray-800 dark:text-white text-lg">{envio.origen}</p>
                 <p className="text-sm text-gray-500">{empresa?.nombre}</p>
               </div>
            </div>

            <div className="flex gap-4">
               <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-success-50 flex items-center justify-center text-success-500 dark:bg-success-500/10">
                 <BoxCubeIcon className="size-5" />
               </div>
               <div>
                 <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Destino</p>
                 <p className="font-medium text-gray-800 dark:text-white text-lg">{envio.departamentoDestino}</p>
                 <p className="text-sm text-gray-500">{envio.direccionDestino}</p>
               </div>
            </div>
          </div>
        </div>

        {/* CONDUCTOR & CARGA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComponentCard title="Conductor Asignado">
            <div className="p-5">
              {conductor ? (
                <div className="flex items-center gap-4">
                  {conductor.fotoUrl ? (
                    <div className="h-16 w-16 overflow-hidden rounded-full">
                      <Image src={conductor.fotoUrl} alt={conductor.nombre} width={64} height={64} className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 text-xl">
                      <AvatarText name={conductor.nombre} />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800 dark:text-white/90 text-lg">{conductor.nombre}</p>
                    <p className="text-sm text-gray-500">{conductor.tipoVehiculo} - {conductor.placaVehiculo}</p>
                    <p className="text-sm text-brand-500">{conductor.telefono}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <UserIcon className="size-10 mb-2 opacity-50" />
                  <p>Aún no se ha asignado un conductor</p>
                </div>
              )}
            </div>
          </ComponentCard>

          <ComponentCard title="Carga Transportada">
            <div className="p-5">
              <ul className="space-y-3">
                {articulos.map((art, idx) => (
                  <li key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{art.nombre}</span>
                    <span className="font-medium text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-xs">
                      x{art.cantidad}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <span className="text-sm text-gray-500 font-semibold uppercase">Costo Total</span>
                <span className="text-lg font-bold text-brand-600">Bs {envio.costoTotal}</span>
              </div>
            </div>
          </ComponentCard>
        </div>

      </div>
    </div>
  );
}

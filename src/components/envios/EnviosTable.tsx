"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import StatCard from "@/components/proveedores/StatCard";
import { Envio } from "@/data/mock/envios";
import { Empresa } from "@/data/mock/empresas";
import { Conductor } from "@/data/mock/conductores";
import { envioService } from "@/services/envioService";
import { empresaService } from "@/services/empresaService";
import { conductorService } from "@/services/conductorService";
import { BoxIcon, CheckCircleIcon, PlusIcon, CalenderIcon, MoreDotIcon, EyeIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

const PAGE_SIZE = 8;

export default function EnviosTable() {
  const router = useRouter();
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, Empresa>>({});
  const [conductores, setConductores] = useState<Record<string, Conductor>>({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [enviosData, empresasData, conductoresData] = await Promise.all([
        envioService.getEnvios(),
        empresaService.getEmpresas(),
        conductorService.getConductores(),
      ]);
      
      const empMap: Record<string, Empresa> = {};
      empresasData.forEach(e => empMap[e.id] = e);
      setEmpresas(empMap);

      const condMap: Record<string, Conductor> = {};
      conductoresData.forEach(c => condMap[c.id] = c);
      setConductores(condMap);

      setEnvios(enviosData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return envios.filter((e) => {
      const empresaNombre = empresas[e.empresaId]?.nombre.toLowerCase() || "";
      const conductorNombre = e.conductorId ? conductores[e.conductorId]?.nombre.toLowerCase() : "";
      
      const matchesSearch =
        !term || 
        e.id.toLowerCase().includes(term) || 
        empresaNombre.includes(term) || 
        conductorNombre.includes(term) ||
        e.departamentoDestino.toLowerCase().includes(term);
        
      const matchesEstado = !estadoFilter || e.estado === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [envios, empresas, conductores, searchTerm, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(
    () => ({
      total: envios.length,
      pendientes: envios.filter((e) => e.estado === "Pendiente" || e.estado === "Asignado").length,
      enCamino: envios.filter((e) => e.estado === "En Camino").length,
      entregados: envios.filter((e) => e.estado === "Entregado").length,
    }),
    [envios]
  );

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case "Entregado": return "success";
      case "En Camino": return "warning";
      case "Pendiente": return "error";
      case "Asignado": return "info";
      default: return "light";
    }
  };

  const formatearFecha = (fechaIso: string) => {
    const d = new Date(fechaIso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Cargando envíos...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard icon={<BoxIcon className="text-gray-800 size-6 dark:text-white/90" />} label="Total Envíos" value={stats.total} />
        <StatCard icon={<CalenderIcon className="text-error-500 size-6" />} label="Por Despachar" value={stats.pendientes} />
        <StatCard icon={<BoxIcon className="text-warning-500 size-6" />} label="En Camino" value={stats.enCamino} />
        <StatCard icon={<CheckCircleIcon className="text-success-500 size-6" />} label="Entregados" value={stats.entregados} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <Input
              placeholder="Buscar por ID, empresa, conductor, destino..."
              defaultValue={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="sm:w-48">
            <SelectField
              placeholder="Todos los estados"
              options={[
                { value: "Pendiente", label: "Pendiente" },
                { value: "Asignado", label: "Asignado" },
                { value: "En Camino", label: "En Camino" },
                { value: "Entregado", label: "Entregado" },
                { value: "Cancelado", label: "Cancelado" },
              ]}
              onChange={(value) => {
                setEstadoFilter(value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <Button startIcon={<PlusIcon />} onClick={() => router.push("/envios/nuevo")}>Nuevo Envío</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID Envío</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Empresa / Fecha</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ruta</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Conductor</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.map((envio) => (
                <TableRow key={envio.id}>
                  <TableCell className="px-5 py-4">
                    <span className="font-mono text-theme-sm font-semibold text-brand-500">{envio.id}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{empresas[envio.empresaId]?.nombre || "Desconocida"}</p>
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">{formatearFecha(envio.fechaCreacion)}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <p className="text-gray-700 text-theme-sm dark:text-gray-300 font-medium">
                      {envio.origen} &rarr; {envio.departamentoDestino}
                    </p>
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400 truncate max-w-[150px] inline-block">{envio.direccionDestino}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {envio.conductorId && conductores[envio.conductorId] ? (
                       <p className="text-gray-700 text-theme-sm dark:text-gray-300">{conductores[envio.conductorId].nombre}</p>
                    ) : (
                       <span className="text-gray-400 text-theme-sm italic">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color={getBadgeColor(envio.estado) as any}>
                      {envio.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="relative px-5 py-4 text-right">
                    <button
                      className="dropdown-toggle text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                      onClick={() => setOpenMenuRowId(openMenuRowId === envio.id ? null : envio.id)}
                    >
                      <MoreDotIcon />
                    </button>
                    <Dropdown isOpen={openMenuRowId === envio.id} onClose={() => setOpenMenuRowId(null)} className="w-48 p-2 z-10">
                      <DropdownItem onItemClick={() => router.push(`/envios/${envio.id}`)} className="flex items-center gap-2 rounded-lg">
                        <EyeIcon className="size-4" /> Ver Tracking
                      </DropdownItem>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                    No se encontraron envíos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}

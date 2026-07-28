"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import StatCard from "@/components/proveedores/StatCard";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Conductor } from "@/data/mock/conductores";
import { conductorService } from "@/services/conductorService";
import { GroupIcon, CheckCircleIcon, CloseLineIcon, PlusIcon, MoreDotIcon, EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import ConductorForm, { ConductorFormData } from "./ConductorForm";

const PAGE_SIZE = 8;

export default function ConductoresTable() {
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"" | "Disponible" | "En Ruta" | "Inactivo">("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [conductorToDelete, setConductorToDelete] = useState<Conductor | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const fetchConductores = useCallback(async () => {
    setLoading(true);
    const data = await conductorService.getConductores();
    setConductores(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConductores();
  }, [fetchConductores]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return conductores.filter((c) => {
      const matchesSearch =
        !term || c.nombre.toLowerCase().includes(term) || c.licencia.toLowerCase().includes(term) || c.placaVehiculo.toLowerCase().includes(term);
      const matchesEstado = !estadoFilter || c.estado === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [conductores, searchTerm, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(
    () => ({
      total: conductores.length,
      disponibles: conductores.filter((c) => c.estado === "Disponible").length,
      enRuta: conductores.filter((c) => c.estado === "En Ruta").length,
    }),
    [conductores]
  );

  // Funciones de Modal
  const openCreate = () => {
    setFormMode("create");
    setSelectedConductor(null);
    formModal.openModal();
  };
  const openEdit = (conductor: Conductor) => {
    setFormMode("edit");
    setSelectedConductor(conductor);
    setOpenMenuRowId(null);
    formModal.openModal();
  };
  const openView = (conductor: Conductor) => {
    setFormMode("view");
    setSelectedConductor(conductor);
    setOpenMenuRowId(null);
    formModal.openModal();
  };
  const askDelete = (conductor: Conductor) => {
    setConductorToDelete(conductor);
    setOpenMenuRowId(null);
    deleteModal.openModal();
  };

  const handleSubmit = async (data: ConductorFormData) => {
    if (formMode === "create") {
      await conductorService.createConductor(data);
    } else if (formMode === "edit" && selectedConductor) {
      await conductorService.updateConductor(selectedConductor.id, data);
    }
    await fetchConductores(); // Refresh table
    formModal.closeModal();
  };

  const { pending: deleting, run: runDelete } = useSubmitLock();

  const confirmDelete = () =>
    runDelete(async () => {
      if (conductorToDelete) {
        await conductorService.deleteConductor(conductorToDelete.id);
        await fetchConductores();
      }
      deleteModal.closeModal();
      setConductorToDelete(null);
    });

  if (loading && conductores.length === 0) {
    return <div className="p-10 text-center text-gray-500">Cargando conductores...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />} label="Total Conductores" value={stats.total} />
        <StatCard icon={<CheckCircleIcon className="text-success-500 size-6" />} label="Disponibles" value={stats.disponibles} />
        <StatCard icon={<CloseLineIcon className="text-brand-500 size-6" />} label="En Ruta" value={stats.enRuta} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <Input
              placeholder="Buscar por nombre, licencia..."
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
                { value: "Disponible", label: "Disponible" },
                { value: "En Ruta", label: "En Ruta" },
                { value: "Inactivo", label: "Inactivo" },
              ]}
              onChange={(value) => {
                setEstadoFilter(value as "" | "Disponible" | "En Ruta" | "Inactivo");
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <Button startIcon={<PlusIcon />} onClick={openCreate}>Agregar Conductor</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Conductor</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Licencia</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Vehículo</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Placa</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.map((conductor) => (
                <TableRow key={conductor.id}>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {conductor.fotoUrl ? (
                         <div className="h-10 w-10 overflow-hidden rounded-full">
                           <Image src={conductor.fotoUrl} alt={conductor.nombre} width={40} height={40} className="object-cover" />
                         </div>
                      ) : (
                         <AvatarText name={conductor.nombre} />
                      )}
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{conductor.nombre}</p>
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400">{conductor.telefono}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300">{conductor.licencia}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{conductor.tipoVehiculo}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 font-mono">{conductor.placaVehiculo}</TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color={conductor.estado === "Disponible" ? "success" : conductor.estado === "En Ruta" ? "warning" : "light"}>
                      {conductor.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openView(conductor)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                        title="Ver"
                      >
                        <EyeIcon className="size-4" /> Ver
                      </button>
                      <button
                        onClick={() => openEdit(conductor)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="size-4" /> Editar
                      </button>
                      <button
                        onClick={() => askDelete(conductor)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                        title="Eliminar"
                      >
                        <TrashBinIcon className="size-4" /> Eliminar
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                    No se encontraron conductores.
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

      <Modal isOpen={formModal.isOpen} onClose={formModal.closeModal} className="max-w-[640px] m-4 z-50">
        <ConductorForm
          key={selectedConductor?.id ?? "new"}
          mode={formMode}
          initialData={selectedConductor}
          onSubmit={handleSubmit}
          onCancel={formModal.closeModal}
        />
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[420px] m-4 z-50">
        <div className="p-6">
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Eliminar conductor</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            ¿Eliminar a <strong>{conductorToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={deleteModal.closeModal} disabled={deleting}>Cancelar</Button>
            <Button onClick={confirmDelete} disabled={deleting}>{deleting ? "Eliminando…" : "Eliminar"}</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

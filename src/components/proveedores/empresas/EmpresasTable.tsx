"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import Pagination from "@/components/tables/Pagination";
import StatCard from "@/components/proveedores/StatCard";
import { useModal } from "@/hooks/useModal";
import { useProveedoresData } from "@/context/ProveedoresContext";
import EmpresaForm, { EmpresaFormData } from "./EmpresaForm";
import { Empresa } from "@/data/mock/empresas";
import { GroupIcon, CheckCircleIcon, CloseLineIcon, PlusIcon, MoreDotIcon, EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";

const PAGE_SIZE = 8;

export default function EmpresasTable() {
  const { empresas, usuarios, articulos, addEmpresa, updateEmpresa, deleteEmpresa } =
    useProveedoresData();

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"" | "Activo" | "Inactivo">("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const counts = useMemo(() => {
    const usuariosPorEmpresa: Record<string, number> = {};
    const articulosPorEmpresa: Record<string, number> = {};
    for (const u of usuarios) usuariosPorEmpresa[u.empresaId] = (usuariosPorEmpresa[u.empresaId] ?? 0) + 1;
    for (const a of articulos) articulosPorEmpresa[a.empresaId] = (articulosPorEmpresa[a.empresaId] ?? 0) + 1;
    return { usuariosPorEmpresa, articulosPorEmpresa };
  }, [usuarios, articulos]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return empresas.filter((e) => {
      const matchesSearch =
        !term || e.nombre.toLowerCase().includes(term) || e.ruc.toLowerCase().includes(term);
      const matchesEstado = !estadoFilter || e.estado === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [empresas, searchTerm, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(
    () => ({
      total: empresas.length,
      activas: empresas.filter((e) => e.estado === "Activo").length,
      inactivas: empresas.filter((e) => e.estado === "Inactivo").length,
    }),
    [empresas]
  );

  const openCreate = () => {
    setFormMode("create");
    setSelectedEmpresa(null);
    formModal.openModal();
  };
  const openEdit = (empresa: Empresa) => {
    setFormMode("edit");
    setSelectedEmpresa(empresa);
    setOpenMenuRowId(null);
    formModal.openModal();
  };
  const openView = (empresa: Empresa) => {
    setFormMode("view");
    setSelectedEmpresa(empresa);
    setOpenMenuRowId(null);
    formModal.openModal();
  };
  const askDelete = (empresa: Empresa) => {
    setEmpresaToDelete(empresa);
    setOpenMenuRowId(null);
    deleteModal.openModal();
  };

  const handleSubmit = (data: EmpresaFormData) => {
    if (formMode === "create") {
      addEmpresa(data);
    } else if (formMode === "edit" && selectedEmpresa) {
      updateEmpresa(selectedEmpresa.id, data);
    }
    formModal.closeModal();
  };

  const confirmDelete = () => {
    if (empresaToDelete) deleteEmpresa(empresaToDelete.id);
    deleteModal.closeModal();
    setEmpresaToDelete(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />} label="Total de empresas" value={stats.total} />
        <StatCard icon={<CheckCircleIcon className="text-success-500 size-6" />} label="Activas" value={stats.activas} />
        <StatCard icon={<CloseLineIcon className="text-gray-400 size-6" />} label="Inactivas" value={stats.inactivas} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <Input
              placeholder="Buscar por nombre o RUC..."
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
                { value: "Activo", label: "Activo" },
                { value: "Inactivo", label: "Inactivo" },
              ]}
              onChange={(value) => {
                setEstadoFilter(value as "" | "Activo" | "Inactivo");
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <Button startIcon={<PlusIcon />} onClick={openCreate}>
          Agregar empresa
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Empresa</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contacto</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ciudad</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Usuarios</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Artículos</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <span className="sr-only">Acciones</span>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarText name={empresa.nombre} />
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{empresa.nombre}</p>
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400">RUC {empresa.ruc}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <p className="text-gray-700 text-theme-sm dark:text-gray-300">{empresa.contacto}</p>
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">{empresa.telefono}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">{empresa.ciudad}</TableCell>
                  <TableCell className="px-5 py-4">
                    <Link
                      href={`/usuarios-proveedores?empresa=${empresa.id}`}
                      className="text-theme-sm font-medium text-brand-500 hover:underline"
                    >
                      {counts.usuariosPorEmpresa[empresa.id] ?? 0}{" "}
                      {(counts.usuariosPorEmpresa[empresa.id] ?? 0) === 1 ? "usuario" : "usuarios"}
                    </Link>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Link
                      href={`/articulos?empresa=${empresa.id}`}
                      className="text-theme-sm font-medium text-brand-500 hover:underline"
                    >
                      {counts.articulosPorEmpresa[empresa.id] ?? 0}{" "}
                      {(counts.articulosPorEmpresa[empresa.id] ?? 0) === 1 ? "artículo" : "artículos"}
                    </Link>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color={empresa.estado === "Activo" ? "success" : "light"}>
                      {empresa.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="relative px-5 py-4 text-right">
                    <button
                      className="dropdown-toggle text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                      onClick={() => setOpenMenuRowId(openMenuRowId === empresa.id ? null : empresa.id)}
                    >
                      <MoreDotIcon />
                    </button>
                    <Dropdown isOpen={openMenuRowId === empresa.id} onClose={() => setOpenMenuRowId(null)} className="w-40 p-2">
                      <DropdownItem onItemClick={() => openView(empresa)} className="flex items-center gap-2 rounded-lg">
                        <EyeIcon className="size-4" /> Ver
                      </DropdownItem>
                      <DropdownItem onItemClick={() => openEdit(empresa)} className="flex items-center gap-2 rounded-lg">
                        <PencilIcon className="size-4" /> Editar
                      </DropdownItem>
                      <DropdownItem onItemClick={() => askDelete(empresa)} className="flex items-center gap-2 rounded-lg text-error-500">
                        <TrashBinIcon className="size-4" /> Eliminar
                      </DropdownItem>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                    No se encontraron empresas con los filtros aplicados.
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

      <Modal isOpen={formModal.isOpen} onClose={formModal.closeModal} className="max-w-[640px] m-4">
        <EmpresaForm
          key={selectedEmpresa?.id ?? "new"}
          mode={formMode}
          initialData={selectedEmpresa}
          onSubmit={handleSubmit}
          onCancel={formModal.closeModal}
        />
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[420px] m-4">
        <div className="p-6">
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Eliminar empresa</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            ¿Eliminar <strong>{empresaToDelete?.nombre}</strong>? Se eliminarán también sus usuarios y artículos asociados. Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={deleteModal.closeModal}>Cancelar</Button>
            <Button onClick={confirmDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

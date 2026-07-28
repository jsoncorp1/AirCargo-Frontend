"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Pagination from "@/components/tables/Pagination";
import {
  branchOfficeService,
  BranchOffice,
  CreateBranchOfficeRequest,
} from "@/services/branchOfficeService";
import { BolivianDepartment, BOLIVIAN_DEPARTMENT_LABELS } from "@/services/supplierService";
import { PencilIcon, TrashBinIcon, GridIcon } from "@/icons";
import { useToast } from "@/context/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  code: string;
  bolivianDepartment: BolivianDepartment;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
}

type ModalMode = "create" | "edit" | "delete";

const DEFAULT_PER_PAGE = 10;

const EMPTY_FORM: FormState = {
  code: "",
  bolivianDepartment: "LaPaz",
  city: "",
  address: "",
  latitude: "",
  longitude: "",
  phone: "",
};

const DEPARTAMENTOS = Object.entries(BOLIVIAN_DEPARTMENT_LABELS) as [BolivianDepartment, string][];

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[20, 32, 44, 24, 28].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded-md bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SucursalesPage() {
  const { showToast } = useToast();

  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<BranchOffice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  const fetchBranchOffices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchOfficeService.getBranchOffices(currentPage, perPage);
      setBranchOffices(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error fetching branch offices", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchBranchOffices();
  }, [fetchBranchOffices]);

  // Volver a la página 1 al cambiar el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setModalMode("create");
    setSelected(null);
    setFormData(EMPTY_FORM);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (office: BranchOffice) => {
    setModalMode("edit");
    setSelected(office);
    setFormData({
      code: office.code,
      bolivianDepartment: office.bolivianDepartment,
      city: office.city,
      address: office.address ?? "",
      latitude: office.latitude != null ? String(office.latitude) : "",
      longitude: office.longitude != null ? String(office.longitude) : "",
      phone: office.phone,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openDelete = (office: BranchOffice) => {
    setModalMode("delete");
    setSelected(office);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelected(null);
    setError(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateBranchOfficeRequest = {
        code: formData.code.trim(),
        bolivianDepartment: formData.bolivianDepartment,
        city: formData.city.trim(),
        address: formData.address.trim() || null,
        latitude: formData.latitude.trim() ? Number(formData.latitude) : null,
        longitude: formData.longitude.trim() ? Number(formData.longitude) : null,
        phone: formData.phone.trim(),
      };

      if (modalMode === "create") {
        await branchOfficeService.createBranchOffice(payload);
        showToast("success", "Sucursal creada", `"${payload.code}" fue creada exitosamente.`);
      } else if (modalMode === "edit" && selected) {
        await branchOfficeService.updateBranchOffice(selected.id, payload);
        showToast("success", "Sucursal actualizada", `"${payload.code}" fue actualizada exitosamente.`);
      }

      fetchBranchOffices();
      closeModal();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || "No se pudo completar la operación.";
      setError(msg);
      showToast("error", "Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await branchOfficeService.deleteBranchOffice(selected.id);
      showToast("success", "Sucursal eliminada", `"${selected.code}" fue eliminada.`);
      fetchBranchOffices();
      closeModal();
    } catch (err: unknown) {
      showToast(
        "error",
        "Error al eliminar",
        (err as { message?: string })?.message || "No se pudo eliminar."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageBreadcrumb pageTitle="Sucursales" />

      <div className="space-y-6">
        <ComponentCard title="Administración de Sucursales">
          <div className="mb-5 flex justify-end">
            <Button onClick={openCreate}>+ Nueva Sucursal</Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Código
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Ubicación
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Dirección
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Teléfono
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : branchOffices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                            <GridIcon className="size-7 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            No hay sucursales registradas
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Crea la primera sucursal del sistema.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    branchOffices.map((office) => (
                      <TableRow
                        key={office.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell className="px-5 py-4">
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {office.code}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4">
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {office.city}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {BOLIVIAN_DEPARTMENT_LABELS[office.bolivianDepartment] ?? office.bolivianDepartment}
                          </p>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {office.address || <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {office.phone}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(office)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                              title="Editar sucursal"
                            >
                              <PencilIcon className="size-4 shrink-0" /> Editar
                            </button>
                            <button
                              onClick={() => openDelete(office)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                              title="Eliminar sucursal"
                            >
                              <TrashBinIcon className="size-4 shrink-0" /> Eliminar
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-gray-800">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  perPage={perPage}
                  onPerPageChange={setPerPage}
                />
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal isOpen={isModalOpen && modalMode !== "delete"} onClose={closeModal} className="max-w-[540px] m-4">
        <div className="flex flex-col">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {modalMode === "create" ? "Crear Sucursal" : "Editar Sucursal"}
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {modalMode === "create"
                ? "Completa los campos para registrar una nueva sucursal."
                : `Modificando la sucursal: ${selected?.code}`}
            </p>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Código</Label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="Ej. SCZ-01"
                />
              </div>
              <div>
                <Label required>Teléfono</Label>
                <Input
                  type="text"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="Ej. 77712345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Departamento</Label>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={formData.bolivianDepartment}
                  onChange={(e) => setFormData({ ...formData, bolivianDepartment: e.target.value as BolivianDepartment })}
                  required
                >
                  {DEPARTAMENTOS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Ciudad</Label>
                <Input
                  type="text"
                  value={formData.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, city: e.target.value })}
                  required
                  placeholder="Ej. Santa Cruz de la Sierra"
                />
              </div>
            </div>

            <div>
              <Label>Dirección</Label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej. Av. Ejemplo 123 (opcional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitud</Label>
                <Input
                  type="number"
                  step={0.000001}
                  value={formData.latitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="Ej. -17.7833 (opcional)"
                />
              </div>
              <div>
                <Label>Longitud</Label>
                <Input
                  type="number"
                  step={0.000001}
                  value={formData.longitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="Ej. -63.1821 (opcional)"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button size="sm" variant="outline" type="button" onClick={closeModal}>
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : modalMode === "create" ? "Crear Sucursal" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal isOpen={isModalOpen && modalMode === "delete"} onClose={closeModal} className="max-w-[420px] m-4">
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-500/10">
            <TrashBinIcon className="size-6 text-error-500" />
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Eliminar sucursal
          </h4>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás segura de eliminar esta sucursal?
          </p>
          {selected && (
            <div className="mb-5 mt-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/40">
              <p className="font-medium text-gray-800 dark:text-white">
                {selected.code} <Badge size="sm" color="light">{BOLIVIAN_DEPARTMENT_LABELS[selected.bolivianDepartment] ?? selected.bolivianDepartment}</Badge>
              </p>
              <p className="text-gray-500">{selected.city}</p>
            </div>
          )}
          <p className="mb-6 text-xs text-error-500">Los usuarios asignados a esta sucursal no podrán atender envíos.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="rounded-lg bg-error-500 px-4 py-2 text-sm font-semibold text-white hover:bg-error-600 transition-colors disabled:opacity-60"
            >
              {submitting ? "Eliminando…" : "Sí, eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

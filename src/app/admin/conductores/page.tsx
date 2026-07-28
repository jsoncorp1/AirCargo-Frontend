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
import { userService, User, CreateUserRequest } from "@/services/userService";
import { CONDUCTOR_ROLE_ID } from "@/services/roleService";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  PencilIcon,
  TrashBinIcon,
  EyeIcon,
  EyeCloseIcon,
  GroupIcon,
} from "@/icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dni: string;
}

type ModalMode = "create" | "edit" | "delete";

const DEFAULT_PER_PAGE = 10;

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  dni: "",
};

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="px-5 py-4">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          <div className="h-3 w-44 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
        </div>
      </TableCell>
      <TableCell className="px-5 py-4">
        <div className="h-4 w-28 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-5 py-4">
        <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-5 py-4">
        <div className="ml-auto h-7 w-36 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      </TableCell>
    </TableRow>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminConductoresPage() {
  const { showToast } = useToast();
  const { branchOfficeId, branchOfficeCode, branchOfficeCity } = useAuth();

  // GET /users como admin ya devuelve solo los conductores de su sucursal
  // (los filtros del request se ignoran en el backend).
  const [conductores, setConductores] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // Cerrojo compartido por guardar y eliminar: bloquea los botones del modal
  // mientras hay una petición en curso (y corta el segundo click del doble click).
  const { pending: submitting, run: runSubmit } = useSubmitLock();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  const branchLabel = [branchOfficeCode, branchOfficeCity].filter(Boolean).join(" — ");

  const fetchConductores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers(currentPage, perPage);
      setConductores(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching conductores", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchConductores();
  }, [fetchConductores]);

  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setModalMode("create");
    setSelectedUser(null);
    setFormData(EMPTY_FORM);
    setShowPassword(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setModalMode("edit");
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: "",
      phoneNumber: user.phoneNumber ?? "",
      dni: user.dni ?? "",
    });
    setShowPassword(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openDelete = (user: User) => {
    setModalMode("delete");
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setError(null);
  };

  // ── Form submit ───────────────────────────────────────────────────────────────

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!branchOfficeId) {
      setError("Tu usuario no tiene una sucursal asignada; no puedes gestionar conductores.");
      return;
    }

    runSubmit(async () => {
      try {
        // El backend exige rol conductor y la sucursal del admin; cualquier otra
        // combinación responde 403 (user.role.forbidden / user.branchoffice.forbidden).
        const payload: CreateUserRequest = {
          ...formData,
          roleId: CONDUCTOR_ROLE_ID,
          branchOfficeId,
          supplierId: null,
        };

        if (modalMode === "create") {
          await userService.createUser(payload);
          showToast(
            "success",
            "Conductor creado",
            `"${formData.fullName}" fue registrado en tu sucursal.`
          );
        } else if (modalMode === "edit" && selectedUser) {
          if (!payload.password) delete payload.password;
          await userService.updateUser(selectedUser.id, payload);
          showToast(
            "success",
            "Conductor actualizado",
            `"${formData.fullName}" fue actualizado exitosamente.`
          );
        }

        fetchConductores();
        closeModal();
      } catch (err) {
        const msg = (err as { message?: string }).message || "No se pudo completar la operación.";
        setError(msg);
        showToast("error", "Error", msg);
      }
    });
  };

  const handleDelete = () =>
    runSubmit(async () => {
      if (!selectedUser) return;
      try {
        await userService.deleteUser(selectedUser.id);
        showToast(
          "success",
          "Conductor eliminado",
          `"${selectedUser.fullName}" fue eliminado.`
        );
        fetchConductores();
        closeModal();
      } catch (err) {
        showToast("error", "Error al eliminar", (err as { message?: string }).message || "No se pudo eliminar.");
      }
    });

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageBreadcrumb pageTitle="Conductores" />

      <div className="space-y-6">
        <ComponentCard title={`Conductores de mi Sucursal${branchLabel ? ` (${branchLabel})` : ""}`}>
          <div className="mb-5 flex justify-end">
            <Button onClick={openCreate}>+ Nuevo Conductor</Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Conductor
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Teléfono
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Sucursal
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : conductores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                            <GroupIcon className="size-7 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            No hay conductores en tu sucursal
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Crea el primer conductor de tu sucursal.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    conductores.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {user.fullName}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {user.phoneNumber || <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                        </TableCell>

                        <TableCell className="px-5 py-4">
                          <Badge size="sm" color="info">
                            {user.branchOfficeCode ?? branchOfficeCode ?? "—"}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(user)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                              title="Editar conductor"
                            >
                              <PencilIcon className="size-4 shrink-0" /> Editar
                            </button>
                            <button
                              onClick={() => openDelete(user)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                              title="Eliminar conductor"
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
              {modalMode === "create" ? "Nuevo Conductor" : "Editar Conductor"}
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {modalMode === "create"
                ? "El conductor se registrará en tu sucursal con el rol conductor."
                : `Modificando al conductor: ${selectedUser?.fullName}`}
            </p>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            )}

            <div>
              <Label required>Nombre Completo</Label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <Label required>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <Label required={modalMode === "create"}>
                Contraseña {modalMode === "edit" && <span className="ml-1 text-xs font-normal text-gray-400">(dejar vacío para no cambiar)</span>}
              </Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={modalMode === "create"}
                placeholder={modalMode === "edit" ? "••••••••" : "Mínimo 8 caracteres"}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center justify-center rounded-md p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? (
                      <EyeCloseIcon className="size-[18px]" />
                    ) : (
                      <EyeIcon className="size-[18px]" />
                    )}
                  </button>
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+591 7XXXXXXX"
                />
              </div>
              <div>
                <Label>DNI / CI</Label>
                <Input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  placeholder="Número de identidad"
                />
              </div>
            </div>

            {/* Rol y sucursal fijos: el backend solo permite conductores de la sucursal del admin */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rol</Label>
                <Input type="text" value="Conductor" disabled />
              </div>
              <div>
                <Label>Sucursal</Label>
                <Input type="text" value={branchLabel || "Sin sucursal"} disabled />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button size="sm" variant="outline" type="button" onClick={closeModal} disabled={submitting}>
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : modalMode === "create" ? "Crear Conductor" : "Guardar Cambios"}
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
            Eliminar conductor
          </h4>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás seguro de eliminar este conductor?
          </p>
          {selectedUser && (
            <div className="mb-5 mt-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/40">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                {selectedUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{selectedUser.fullName}</p>
                <p className="text-xs text-gray-400">{selectedUser.email}</p>
              </div>
            </div>
          )}
          <p className="mb-6 text-xs text-error-500">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="rounded-lg bg-error-500 px-4 py-2 text-sm font-semibold text-white hover:bg-error-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Eliminando…" : "Sí, eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

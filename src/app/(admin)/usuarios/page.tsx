"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { userService, User, CreateUserRequest } from "@/services/userService";
import { roleService, Role } from "@/services/roleService";
import { supplierService, Supplier } from "@/services/supplierService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import {
  PencilIcon,
  TrashBinIcon,
  EyeIcon,
  EyeCloseIcon,
  PlugInIcon,
  GroupIcon,
} from "@/icons";
import { useToast } from "@/context/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dni: string;
  roleId: string;
  supplierId: string;
  branchOfficeId: string;
}

type ModalMode = "create" | "edit" | "delete";

const DEFAULT_PER_PAGE = 10;
// El backend no soporta búsqueda de texto ni filtro por rol como query params;
// mientras esos filtros estén activos se trae un lote más grande para filtrar en cliente.
const SEARCH_BATCH_SIZE = 200;

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  dni: "",
  roleId: "",
  supplierId: "",
  branchOfficeId: "",
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

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

export default function UsuariosPage() {
  const { showToast } = useToast();

  // ── Data state ──────────────────────────────────────────────────────────────
  // Página real del servidor: se usa cuando no hay búsqueda ni filtro de rol activos.
  const [pageUsers, setPageUsers] = useState<User[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  // Lote grande para búsqueda/tabs de rol (el backend no soporta esos filtros como query params).
  const [batchUsers, setBatchUsers] = useState<User[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // Cerrojo compartido por guardar y eliminar: bloquea los botones del modal
  // mientras hay una petición en curso (y corta el segundo click del doble click).
  const { pending: submitting, run: runSubmit } = useSubmitLock();
  const [error, setError] = useState<string | null>(null);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // El backend no soporta buscar por texto ni filtrar por rol, así que mientras
  // alguno de estos filtros esté activo se pagina en cliente sobre el lote grande.
  const isFiltering = Boolean(searchTerm.trim()) || Boolean(roleFilter);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    batchUsers.forEach((u) => {
      counts[u.roleId] = (counts[u.roleId] ?? 0) + 1;
    });
    return counts;
  }, [batchUsers]);

  const roleTabs: TabItem[] = useMemo(
    () => [
      { value: "", label: "Todos", count: batchUsers.length },
      ...roles.map((r) => ({ value: r.id, label: r.name, count: roleCounts[r.id] ?? 0 })),
    ],
    [roles, roleCounts, batchUsers.length]
  );

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return batchUsers.filter((u) => {
      const matchesSearch =
        !term ||
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phoneNumber || "").toLowerCase().includes(term) ||
        (u.roleName || "").toLowerCase().includes(term) ||
        (u.supplierName || "").toLowerCase().includes(term) ||
        (u.branchOfficeCode || "").toLowerCase().includes(term) ||
        (u.branchOfficeCity || "").toLowerCase().includes(term);
      const matchesRole = !roleFilter || u.roleId === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [batchUsers, searchTerm, roleFilter]);

  const filteredTotalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedFilteredUsers = filteredUsers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const displayedUsers = isFiltering ? paginatedFilteredUsers : pageUsers;
  const totalPages = isFiltering ? filteredTotalPages : pageTotalPages;
  const loading = isFiltering ? batchLoading : pageLoading;

  const selectedRole = roles.find((r) => r.id === formData.roleId);
  const selectedRoleName = selectedRole?.name?.toLowerCase() ?? "";
  const isProveedorRole =
    selectedRoleName.includes("empresa") || selectedRoleName.includes("proveedor");
  // El backend valida coherencia rol ↔ alcance: admin y conductor requieren
  // sucursal (y no pueden tener proveedor); usuarioempresa requiere proveedor
  // (y no puede tener sucursal).
  const isBranchRole = selectedRoleName === "admin" || selectedRoleName === "conductor";

  // ── Data fetching ─────────────────────────────────────────────────────────────

  const fetchPageUsers = useCallback(async (page: number) => {
    setPageLoading(true);
    try {
      const response = await userService.getUsers(page, perPage);
      setPageUsers(response.data);
      setPageTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setPageLoading(false);
    }
  }, [perPage]);

  const fetchBatchUsers = useCallback(async () => {
    setBatchLoading(true);
    try {
      const response = await userService.getUsers(1, SEARCH_BATCH_SIZE);
      setBatchUsers(response.data);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setBatchLoading(false);
    }
  }, []);

  const fetchAllUsers = useCallback(() => {
    fetchPageUsers(currentPage);
    fetchBatchUsers();
  }, [fetchPageUsers, fetchBatchUsers, currentPage]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [rolesResp, suppResp, branchResp] = await Promise.all([
        roleService.getRoles(1, 100),
        supplierService.getSuppliers(1, 100),
        branchOfficeService.getBranchOffices(1, 100),
      ]);
      setRoles(rolesResp.data);
      setSuppliers(suppResp.data);
      setBranchOffices(branchResp.data);
    } catch (err) {
      console.error("Error fetching dependencies", err);
    }
  }, []);

  useEffect(() => {
    fetchPageUsers(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchBatchUsers();
    fetchDependencies();
  }, [fetchBatchUsers, fetchDependencies]);

  // Volver a la página 1 al activar/cambiar un filtro o el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, perPage]);

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setModalMode("create");
    setSelectedUser(null);
    setFormData({ ...EMPTY_FORM, roleId: roles[0]?.id ?? "" });
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
      roleId: user.roleId,
      supplierId: user.supplierId ?? "",
      branchOfficeId: user.branchOfficeId ?? "",
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
    runSubmit(async () => {
      try {
        const payload: any = { ...formData };

        // Coherencia rol ↔ alcance (el backend la rechaza con 400 si no se cumple):
        // usuarioempresa ⇒ proveedor obligatorio, sin sucursal;
        // admin/conductor ⇒ sucursal obligatoria, sin proveedor.
        if (isProveedorRole) {
          if (!payload.supplierId) {
            throw new Error("Debe seleccionar un proveedor para este rol.");
          }
          payload.branchOfficeId = null;
        } else if (isBranchRole) {
          if (!payload.branchOfficeId) {
            throw new Error("Debe seleccionar una sucursal para este rol.");
          }
          payload.supplierId = null;
        } else {
          // superadmin: la sucursal es opcional y no lleva proveedor.
          delete payload.supplierId;
          payload.branchOfficeId = payload.branchOfficeId || null;
        }

        if (modalMode === "create") {
          await userService.createUser(payload as CreateUserRequest);
          showToast(
            "success",
            "Usuario creado",
            `"${formData.fullName}" fue creado exitosamente.`
          );
        } else if (modalMode === "edit" && selectedUser) {
          // Remove password from payload if empty (don't update password if not filled)
          if (!payload.password) delete payload.password;
          await userService.updateUser(selectedUser.id, payload);
          showToast(
            "success",
            "Usuario actualizado",
            `"${formData.fullName}" fue actualizado exitosamente.`
          );
        }

        fetchAllUsers();
        closeModal();
      } catch (err: any) {
        const msg = err.message || "No se pudo completar la operación.";
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
          "Usuario eliminado",
          `"${selectedUser.fullName}" fue eliminado.`
        );
        fetchAllUsers();
        closeModal();
      } catch (err: any) {
        showToast("error", "Error al eliminar", err.message || "No se pudo eliminar.");
      }
    });

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageBreadcrumb pageTitle="Usuarios del Sistema" />

      <div className="space-y-6">
        <ComponentCard title="Administración de Usuarios">
          {/* ── Role Tabs ── */}
          <div className="mb-5 border-b border-gray-100 pb-5 dark:border-gray-800">
            <Tabs items={roleTabs} value={roleFilter} onChange={setRoleFilter} />
          </div>

          {/* ── Filter Bar ── */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder-gray-500"
                  placeholder="Buscar por nombre, email, rol, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={openCreate}>+ Nuevo Usuario</Button>
          </div>

          {/* ── Table ── */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Usuario
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Teléfono
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Rol
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Empresa
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
                  ) : displayedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                            <GroupIcon className="size-7 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {searchTerm || roleFilter ? "No se encontraron resultados" : "No hay usuarios registrados"}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {searchTerm || roleFilter ? "Prueba ajustando los filtros de búsqueda." : "Crea el primer usuario del sistema."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Name + Email */}
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

                        {/* Phone */}
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {user.phoneNumber || <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                        </TableCell>

                        {/* Role badge */}
                        <TableCell className="px-5 py-4">
                          <Badge size="sm" color="info">
                            {user.roleName}
                          </Badge>
                        </TableCell>

                        {/* Supplier / Empresa */}
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {user.supplierName || <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                        </TableCell>

                        {/* Branch office / Sucursal */}
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {user.branchOfficeCode ? (
                            <>
                              <p className="font-medium text-gray-700 dark:text-gray-300">{user.branchOfficeCode}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{user.branchOfficeCity}</p>
                            </>
                          ) : (
                            <span className="italic text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(user)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                              title="Editar usuario"
                            >
                              <PencilIcon className="size-4 shrink-0" /> Editar
                            </button>
                            <button
                              onClick={() => openDelete(user)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                              title="Eliminar usuario"
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
          {/* Header */}
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {modalMode === "create" ? "Crear Usuario" : "Editar Usuario"}
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {modalMode === "create"
                ? "Completa los campos para registrar un nuevo usuario en el sistema."
                : `Modificando el usuario: ${selectedUser?.fullName}. Si cambias su rol, proveedor o sucursal, deberá volver a iniciar sesión.`}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex flex-col gap-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <Label required>Nombre Completo</Label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
                required
                placeholder="Ej. María García"
              />
            </div>

            {/* Email */}
            <div>
              <Label required>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="correo@ejemplo.com"
              />
            </div>

            {/* Password */}
            <div>
              <Label required={modalMode === "create"}>
                Contraseña {modalMode === "edit" && <span className="ml-1 text-xs font-normal text-gray-400">(dejar vacío para no cambiar)</span>}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
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
            </div>

            {/* Phone & DNI side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e: any) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+591 7XXXXXXX"
                />
              </div>
              <div>
                <Label>DNI / CI</Label>
                <Input
                  type="text"
                  value={formData.dni}
                  onChange={(e: any) => setFormData({ ...formData, dni: e.target.value })}
                  placeholder="Número de identidad"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <Label required>Rol del Usuario</Label>
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={formData.roleId}
                onChange={(e: any) => setFormData({ ...formData, roleId: e.target.value, supplierId: "" })}
                required
              >
                <option value="" disabled>Seleccione un rol</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Supplier (conditional) */}
            {isProveedorRole && (
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-900/10">
                <Label required>Proveedor</Label>
                <p className="mb-2 text-xs text-brand-600 dark:text-brand-400">
                  Este rol requiere asociar al usuario con un proveedor.
                </p>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={formData.supplierId}
                  onChange={(e: any) => setFormData({ ...formData, supplierId: e.target.value })}
                  required
                >
                  <option value="" disabled>Seleccione el proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Branch office (required for admin/conductor, optional for superadmin) */}
            {!isProveedorRole && (
              <div>
                <Label required={isBranchRole}>Sucursal</Label>
                <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
                  {isBranchRole
                    ? "Los roles admin y conductor requieren una sucursal: define qué envíos pueden ver y atender."
                    : "La sucursal del usuario se usa como origen al atender envíos. Un usuario sin sucursal no puede atender envíos."}
                </p>
                <select
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={formData.branchOfficeId}
                  onChange={(e) => setFormData({ ...formData, branchOfficeId: e.target.value })}
                  required={isBranchRole}
                >
                  {isBranchRole ? (
                    <option value="" disabled>Seleccione la sucursal</option>
                  ) : (
                    <option value="">Sin sucursal</option>
                  )}
                  {branchOffices.map((b) => (
                    <option key={b.id} value={b.id}>{b.code} — {b.city}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button size="sm" variant="outline" type="button" onClick={closeModal} disabled={submitting}>
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={submitting}>
                {submitting ? "Guardando…" : modalMode === "create" ? "Crear Usuario" : "Guardar Cambios"}
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
            Eliminar usuario
          </h4>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás segura de eliminar este usuario?
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

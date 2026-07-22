"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Pagination from "@/components/tables/Pagination";
import { roleService, Role } from "@/services/roleService";
import { PencilIcon, TrashBinIcon, PlugInIcon } from "@/icons";
import { useToast } from "@/context/ToastContext";

const DEFAULT_PER_PAGE = 10;

export default function RolesPage() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await roleService.getRoles(page, perPage);
      setRoles(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching roles", err);
      showToast("error", "Error al cargar roles", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage]);

  // Volver a la página 1 al cambiar el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  const handleOpenModal = (role?: Role) => {
    setError(null);
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description });
    } else {
      setEditingRole(null);
      setFormData({ name: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, formData);
        showToast("success", "Rol actualizado", `El rol "${formData.name}" fue actualizado correctamente.`);
      } else {
        await roleService.createRole(formData);
        showToast("success", "Rol creado", `El rol "${formData.name}" fue creado correctamente.`);
      }
      await fetchRoles();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    setDeleting(true);
    try {
      await roleService.deleteRole(roleToDelete.id);
      showToast("success", "Rol eliminado", `El rol "${roleToDelete.name}" fue eliminado.`);
      await fetchRoles();
    } catch (err: any) {
      showToast("error", "Error al eliminar", err.message || "No se pudo eliminar el rol.");
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Roles" />
      <div className="space-y-6">
        <ComponentCard title="Administración de Roles">
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleOpenModal()}>Crear Nuevo Rol</Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Nombre
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Descripción
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    /* Skeleton loader */
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-5 py-4">
                          <div className="h-4 w-28 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="h-4 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <PlugInIcon className="size-10 opacity-30" />
                          <p className="text-sm font-medium">No hay roles registrados</p>
                          <p className="text-xs">Crea el primer rol con el botón de arriba.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <TableCell className="px-4 py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-white/90">
                          {role.name}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {role.description || <span className="italic opacity-50">Sin descripción</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(role)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="size-3.5" /> Editar
                            </button>
                            <button
                              onClick={() => askDelete(role)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                              title="Eliminar"
                            >
                              <TrashBinIcon className="size-3.5" /> Eliminar
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
              <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-white/[0.05]">
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

      {/* Form Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-[500px] m-4">
        <div className="relative w-full rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingRole ? "Editar Rol" : "Crear Rol"}
          </h4>
          <form onSubmit={handleSave} className="flex flex-col space-y-4">
            {error && (
              <div className="p-3 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20">
                {error}
              </div>
            )}
            <div>
              <Label required>Nombre del Rol</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="max-w-[420px] m-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/10">
              <TrashBinIcon className="size-5 text-error-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Eliminar Rol</h4>
          </div>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás seguro de eliminar el rol <strong className="text-gray-800 dark:text-white/90">"{roleToDelete?.name}"</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

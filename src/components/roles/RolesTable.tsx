import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Pagination from "@/components/tables/Pagination";
import { roleService, Role } from "@/services/roleService";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { PlusIcon } from "@/icons";

import RolesList from "./RolesList";
import RoleFormModal from "./RoleFormModal";
import RoleDeleteModal from "./RoleDeleteModal";

const DEFAULT_PER_PAGE = 10;

export default function RolesTable() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { pending: saving, run: runSave } = useSubmitLock();
  const { pending: deleting, run: runDelete } = useSubmitLock();

  const fetchRoles = useCallback(async (page = currentPage, limit = perPage) => {
    setLoading(true);
    try {
      const response = await roleService.getRoles(page, limit);
      setRoles(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching roles", err);
      showToast("error", "Error al cargar roles", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, showToast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  // Local Search Filter
  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }, [roles, searchTerm]);

  const handleOpenForm = (role?: Role) => {
    setFormError(null);
    setEditingRole(role || null);
    setIsModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleSave = (data: { name: string; description: string }) => {
    setFormError(null);
    runSave(async () => {
      try {
        if (editingRole) {
          await roleService.updateRole(editingRole.id, data);
          showToast("success", "Rol actualizado", `El rol "${data.name}" fue actualizado correctamente.`);
        } else {
          await roleService.createRole(data);
          showToast("success", "Rol creado", `El rol "${data.name}" fue creado correctamente.`);
        }
        await fetchRoles();
        handleCloseForm();
      } catch (err: any) {
        setFormError(err.message || "Ocurrió un error al guardar.");
      }
    });
  };

  const askDelete = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    runDelete(async () => {
      if (!roleToDelete) return;
      try {
        await roleService.deleteRole(roleToDelete.id);
        showToast("success", "Rol eliminado", `El rol "${roleToDelete.name}" fue eliminado.`);
        await fetchRoles();
      } catch (err: any) {
        showToast("error", "Error al eliminar", err.message || "No se pudo eliminar el rol.");
      } finally {
        setIsDeleteModalOpen(false);
        setRoleToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar rol por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 pl-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 transition-all placeholder:text-gray-400"
          />
          <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-gray-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="shrink-0">
          <Button startIcon={<PlusIcon />} onClick={() => handleOpenForm()} className="w-full sm:w-auto px-6 rounded-full shadow-sm hover:shadow-md">
            Nuevo Rol
          </Button>
        </div>
      </div>

      {/* Grid of Roles */}
      <RolesList
        roles={filteredRoles}
        loading={loading}
        onEdit={handleOpenForm}
        onDelete={askDelete}
      />

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Mostrar</span>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">por página</span>
          </div>
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={handleCloseForm} className="max-w-[480px] m-4 z-50">
        <RoleFormModal
          role={editingRole}
          isSaving={saving}
          onSave={handleSave}
          onCancel={handleCloseForm}
          error={formError}
        />
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="max-w-[420px] m-4 z-50">
        <RoleDeleteModal
          roleName={roleToDelete?.name || ""}
          isDeleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

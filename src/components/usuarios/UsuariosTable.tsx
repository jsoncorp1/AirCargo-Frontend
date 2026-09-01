import React, { useEffect, useState, useMemo, useCallback } from "react";
import Pagination from "@/components/tables/Pagination";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";

import { userService, User } from "@/services/userService";
import { roleService, Role } from "@/services/roleService";
import { supplierService, Supplier } from "@/services/supplierService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import { TabItem } from "@/components/ui/tabs/Tabs";

import UsuariosToolbar from "./UsuariosToolbar";
import UsuariosList from "./UsuariosList";
import UsuarioFormModal from "./UsuarioFormModal";
import UsuarioDeleteModal from "./UsuarioDeleteModal";

const DEFAULT_PER_PAGE = 10;
const SEARCH_BATCH_SIZE = 200; // Para permitir filtrado local (frontend) por rol/texto

export default function UsuariosTable() {
  const { showToast } = useToast();

  // --- Data States ---
  const [pageUsers, setPageUsers] = useState<User[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);

  // --- Search/Filter States (Local) ---
  const [batchUsers, setBatchUsers] = useState<User[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [hasFetchedBatch, setHasFetchedBatch] = useState(false);
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);

  // --- Controls ---
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // --- Modals ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { pending: saving, run: runSave } = useSubmitLock();
  const { pending: deleting, run: runDelete } = useSubmitLock();

  const isFiltering = searchTerm.trim().length > 0 || roleFilter !== "";

  // 1. Cargar metadatos básicos
  //
  // Son tres listas INDEPENDIENTES, así que van con `allSettled` y no con
  // `all`: con `all` un solo rechazo (proveedores o sucursales) descartaba
  // también los roles que sí habían respondido, y el alta de usuario quedaba
  // con el selector de rol vacío como si nunca se hubieran pedido. El error
  // además solo iba a la consola, así que desde la pantalla no se veía nada.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [rolesRes, suppRes, branchRes] = await Promise.allSettled([
        roleService.getRoles(1, 100),
        supplierService.getSuppliers(1, 100),
        branchOfficeService.getBranchOffices(1, 100),
      ]);

      if (cancelled) return;

      const failed: string[] = [];

      if (rolesRes.status === "fulfilled") setRoles(rolesRes.value.data);
      else {
        console.error("Error cargando roles:", rolesRes.reason);
        failed.push("los roles");
      }

      if (suppRes.status === "fulfilled") setSuppliers(suppRes.value.data);
      else {
        console.error("Error cargando proveedores:", suppRes.reason);
        failed.push("los proveedores");
      }

      if (branchRes.status === "fulfilled") setBranchOffices(branchRes.value.data);
      else {
        console.error("Error cargando sucursales:", branchRes.reason);
        failed.push("las sucursales");
      }

      if (failed.length > 0) {
        showToast(
          "error",
          "Datos incompletos",
          `No se pudieron cargar ${failed.join(" ni ")}. El formulario de usuario va a quedar sin esas opciones.`
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // 2. Fetch paginado normal
  const fetchPage = useCallback(async () => {
    if (isFiltering) return;
    setPageLoading(true);
    try {
      const res = await userService.getUsers(currentPage, perPage);
      setPageUsers(res.data);
      setPageTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudieron cargar los usuarios.");
    } finally {
      setPageLoading(false);
    }
  }, [currentPage, perPage, isFiltering, showToast]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // 3. Fetch de lote completo (solo al buscar/filtrar)
  const fetchBatch = useCallback(async () => {
    if (hasFetchedBatch) return;
    setBatchLoading(true);
    try {
      const res = await userService.getUsers(1, SEARCH_BATCH_SIZE);
      setBatchUsers(res.data);
      setHasFetchedBatch(true);
    } catch (err) {
      console.error(err);
    } finally {
      setBatchLoading(false);
    }
  }, [hasFetchedBatch]);

  useEffect(() => {
    if (isFiltering && !hasFetchedBatch) {
      fetchBatch();
    }
  }, [isFiltering, hasFetchedBatch, fetchBatch]);

  // Vuelve a pag 1 si se cambia limit o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, searchTerm, roleFilter]);

  // --- Filtering Logic ---
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    batchUsers.forEach((u) => {
      if (u.roleId) counts[u.roleId] = (counts[u.roleId] || 0) + 1;
    });
    return counts;
  }, [batchUsers]);

  const roleTabs: TabItem[] = useMemo(
    () => [
      { value: "", label: "Todos", count: batchUsers.length || undefined },
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

  // --- Handlers ---
  const reloadData = async () => {
    if (isFiltering) {
      setHasFetchedBatch(false); // force re-fetch batch
    } else {
      await fetchPage();
    }
  };

  const handleOpenForm = (user?: User) => {
    setFormError(null);
    setEditingUser(user || null);
    setIsModalOpen(true);
  };

  const handleSave = (data: any) => {
    setFormError(null);
    runSave(async () => {
      try {
        if (editingUser) {
          const payload = { ...data };
          if (!payload.password) delete payload.password;
          await userService.updateUser(editingUser.id, payload);
          showToast("success", "Usuario actualizado", "Se guardaron los cambios correctamente.");
        } else {
          await userService.createUser(data);
          showToast("success", "Usuario creado", "El nuevo usuario fue registrado.");
        }
        setIsModalOpen(false);
        await reloadData();
      } catch (err: any) {
        setFormError(err.message || "Error al guardar el usuario.");
      }
    });
  };

  const askDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    runDelete(async () => {
      if (!userToDelete) return;
      try {
        await userService.deleteUser(userToDelete.id);
        showToast("success", "Eliminado", `El usuario ${userToDelete.fullName} ha sido eliminado.`);
        await reloadData();
      } catch (err: any) {
        showToast("error", "Error al eliminar", err.message || "Hubo un problema al eliminar.");
      } finally {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <UsuariosToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleTabs={roleTabs}
        selectedRoleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onNewUser={() => handleOpenForm()}
      />

      <UsuariosList
        users={displayedUsers}
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-[540px] m-4 z-50">
        <UsuarioFormModal
          user={editingUser}
          roles={roles}
          suppliers={suppliers}
          branchOffices={branchOffices}
          isSaving={saving}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
          error={formError}
        />
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="max-w-[420px] m-4 z-50">
        <UsuarioDeleteModal
          userName={userToDelete?.fullName || ""}
          isDeleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

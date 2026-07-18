"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { userService, User } from "@/services/userService";
import { roleService, Role } from "@/services/roleService";
import SelectField from "@/components/form/Select";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon, PencilIcon, TrashBinIcon, PlugInIcon } from "@/icons";
import { useToast } from "@/context/ToastContext";

export default function UsuariosPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    dni: "",
    roleId: "",
  });
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = React.useMemo(() => {
    if (!roleFilter) return users;
    return users.filter(u => u.roleId === roleFilter);
  }, [users, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers();
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleService.getRoles(1, 100); // get all roles
      setRoles(response.data);
    } catch (err) {
      console.error("Error fetching roles", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleOpenModal = () => {
    setError(null);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      dni: "",
      roleId: roles.length > 0 ? roles[0].id : "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await userService.createUser(formData);
      showToast("success", "Usuario creado", `El usuario "${formData.fullName}" fue creado exitosamente.`);
      await fetchUsers();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      showToast("error", "Error al guardar", err.message || "No se pudo crear el usuario.");
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Usuarios Core" />
      <div className="space-y-6">
        <ComponentCard title="Administración de Usuarios">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full sm:w-64">
              <SelectField
                placeholder="Todos los roles"
                options={[
                  { value: "", label: "Todos los roles" },
                  ...roles.map(r => ({ value: r.id, label: r.name }))
                ]}
                onChange={(val) => setRoleFilter(val)}
              />
            </div>
            <Button onClick={handleOpenModal}>Crear Nuevo Usuario</Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Nombre Completo
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Email
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Teléfono
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Rol
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-5 py-4 text-center text-gray-500">Cargando...</TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <PlugInIcon className="size-10 opacity-30" />
                          <p className="text-sm font-medium">No se encontraron usuarios</p>
                          <p className="text-xs">Ajusta los filtros o crea un nuevo usuario.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {user.fullName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {user.email}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {user.phoneNumber}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {user.roleName}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { /* Implement Edit later */ }}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="size-4" /> Editar
                            </button>
                            <button
                              onClick={() => { /* Implement Delete later */ }}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                              title="Eliminar"
                            >
                              <TrashBinIcon className="size-4" /> Eliminar
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-[500px] m-4">
        <div className="relative w-full rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Crear Usuario
          </h4>
          <form onSubmit={handleSave} className="flex flex-col space-y-4 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {error && (
              <div className="p-3 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20">
                {error}
              </div>
            )}
            <div>
              <Label required>Nombre Completo</Label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label required>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label required>Contraseña</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                type="text"
                value={formData.phoneNumber}
                onChange={(e: any) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>DNI</Label>
              <Input
                type="text"
                value={formData.dni}
                onChange={(e: any) => setFormData({ ...formData, dni: e.target.value })}
              />
            </div>
            <div>
              <Label required>Rol</Label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-brand-500 focus:shadow-focus dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-500"
                value={formData.roleId}
                onChange={(e: any) => setFormData({ ...formData, roleId: e.target.value })}
                required
              >
                <option value="" disabled>Seleccione un rol</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button size="sm" type="submit">
                Guardar
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

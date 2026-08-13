import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeIcon, EyeCloseIcon } from "@/icons";
import { Role } from "@/services/roleService";
import { Supplier } from "@/services/supplierService";
import { BranchOffice } from "@/services/branchOfficeService";
import { User } from "@/services/userService";
import { resolveRoleScope, scopeFieldsForRole } from "@/services/userScope";

interface UsuarioFormModalProps {
  user?: User | null;
  roles: Role[];
  suppliers: Supplier[];
  branchOffices: BranchOffice[];
  isSaving: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
  error?: string | null;
}

export default function UsuarioFormModal({
  user,
  roles,
  suppliers,
  branchOffices,
  isSaving,
  onSave,
  onCancel,
  error,
}: UsuarioFormModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    dni: "",
    roleId: "",
    supplierId: "",
    branchOfficeId: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        password: "", // Contraseña vacía al editar
        phoneNumber: user.phoneNumber || "",
        dni: user.dni || "",
        roleId: user.roleId || "",
        supplierId: user.supplierId || "",
        branchOfficeId: user.branchOfficeId || "",
      });
    } else {
      setFormData({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
        dni: "",
        roleId: "",
        supplierId: "",
        branchOfficeId: "",
      });
    }
  }, [user]);

  const selectedRole = roles.find((r) => r.id === formData.roleId);
  const selectedRoleName = selectedRole?.name ?? "";

  // El backend valida rol ↔ ámbito de forma estricta: el superadmin es global
  // (sin proveedor ni sucursal), usuarioempresa lleva proveedor, y
  // admin/conductor llevan sucursal. Mandar el campo que no corresponde da 400.
  const roleScope = resolveRoleScope(selectedRoleName);
  const isProveedorRole = roleScope === "supplier";
  const isBranchRole = roleScope === "branch";
  const isGlobalRole = roleScope === "global";

  // Al cambiar de rol hay que limpiar el campo que deja de corresponder: si no,
  // el form arrastra la sucursal de un admin al pasar a usuarioempresa y el
  // backend rechaza con `user.branchofficeid.notallowed`.
  const handleRoleChange = (roleId: string) => {
    const nextRole = roles.find((r) => r.id === roleId);
    const scoped = scopeFieldsForRole(nextRole?.name, formData);
    setFormData({
      ...formData,
      roleId,
      supplierId: scoped.supplierId ?? "",
      branchOfficeId: scoped.branchOfficeId ?? "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Segunda red: aunque el form ya limpia al cambiar de rol, el payload se
    // normaliza otra vez y manda `null` (no "") en el campo que no aplica.
    const scoped = scopeFieldsForRole(selectedRoleName, formData);
    onSave({ ...formData, ...scoped });
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {user ? "Editar Usuario" : "Crear Usuario"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {user
            ? `Modificando el usuario: ${user.fullName}. Si cambias su rol, proveedor o sucursal, deberá volver a iniciar sesión.`
            : "Completa los campos para registrar un nuevo usuario en el sistema."}
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 px-6 py-5 max-h-[70vh] overflow-y-auto"
      >
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
            onChange={(e: any) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
            placeholder="Ej. María García"
            disabled={isSaving}
          />
        </div>

        {/* Email */}
        <div>
          <Label required>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e: any) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            placeholder="correo@ejemplo.com"
            disabled={isSaving}
          />
        </div>

        {/* Password */}
        <div>
          <Label required={!user}>
            Contraseña{" "}
            {user && (
              <span className="ml-1 text-xs font-normal text-gray-400">
                (dejar vacío para no cambiar)
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e: any) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!user}
              placeholder={user ? "••••••••" : "Mínimo 8 caracteres"}
              disabled={isSaving}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center justify-center rounded-md p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  disabled={isSaving}
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
              onChange={(e: any) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="+591 7XXXXXXX"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label>DNI / CI</Label>
            <Input
              type="text"
              value={formData.dni}
              onChange={(e: any) =>
                setFormData({ ...formData, dni: e.target.value })
              }
              placeholder="Número de identidad"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Role */}
        <div>
          <Label required>Rol del Usuario</Label>
          <select
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
            value={formData.roleId}
            onChange={(e: any) => handleRoleChange(e.target.value)}
            required
            disabled={isSaving}
          >
            <option value="" disabled>
              Seleccione un rol
            </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
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
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
              value={formData.supplierId}
              onChange={(e: any) =>
                setFormData({ ...formData, supplierId: e.target.value })
              }
              required
              disabled={isSaving}
            >
              <option value="" disabled>
                Seleccione el proveedor
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Branch office (conditional) */}
        {isBranchRole && (
          <div>
            <Label required>Sucursal</Label>
            <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
              Los roles admin y conductor requieren una sucursal: define qué
              envíos pueden ver y atender, y es el origen de los que registran.
            </p>
            <select
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
              value={formData.branchOfficeId}
              onChange={(e: any) =>
                setFormData({ ...formData, branchOfficeId: e.target.value })
              }
              required
              disabled={isSaving}
            >
              <option value="" disabled>
                Seleccione la sucursal
              </option>
              {branchOffices.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Superadmin: es global, no lleva ámbito. Se explica en vez de mostrar
            dos selectores vacíos que el backend rechazaría. */}
        {isGlobalRole && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Acceso global
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              El superadmin no pertenece a ningún proveedor ni sucursal: ve todo
              el sistema y elige desde qué sucursal atiende al registrar un envío.
            </p>
          </div>
        )}

        {/* Rol propio sin regla de ámbito: el backend lo rechaza con
            `user.role.scopeundefined`. Se avisa antes de intentar guardar. */}
        {formData.roleId && roleScope === "unknown" && (
          <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/20 dark:bg-warning-500/10">
            <p className="text-sm font-medium text-warning-700 dark:text-orange-400">
              Rol sin ámbito definido
            </p>
            <p className="mt-1 text-xs text-warning-600 dark:text-orange-400/80">
              El rol &quot;{selectedRoleName}&quot; no tiene definido si opera por
              proveedor o por sucursal, así que no se le pueden asignar usuarios.
              Usa superadmin, admin, conductor o usuarioempresa.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6 justify-end">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            type="submit"
            disabled={isSaving || (!!formData.roleId && roleScope === "unknown")}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

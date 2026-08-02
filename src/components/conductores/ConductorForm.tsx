import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import { User, userService, CreateUserRequest } from "@/services/userService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import { CONDUCTOR_ROLE_ID } from "@/services/roleService";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useToast } from "@/context/ToastContext";

interface ConductorFormProps {
  mode: "create" | "edit" | "view";
  initialData: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ConductorForm({
  mode,
  initialData,
  onClose,
  onSaved,
}: ConductorFormProps) {
  const { showToast } = useToast();
  const [branches, setBranches] = useState<BranchOffice[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || "",
    email: initialData?.email || "",
    password: "",
    dni: initialData?.dni || "",
    phoneNumber: initialData?.phoneNumber || "",
    branchOfficeId: initialData?.branchOfficeId || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await branchOfficeService.getBranchOffices(1, 100);
        setBranches(res.data);
      } catch (err) {
        console.error(err);
        showToast("error", "Error", "No se pudieron cargar las sucursales");
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, [showToast]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "El nombre es requerido";
    if (!formData.email.trim()) newErrors.email = "El correo es requerido";
    if (mode === "create" && !formData.password) newErrors.password = "La contraseña es requerida";
    if (!formData.dni.trim()) newErrors.dni = "El DNI es requerido";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "El teléfono es requerido";
    if (!formData.branchOfficeId) newErrors.branchOfficeId = "Debe asignar una sucursal base";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { pending, run } = useSubmitLock();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") return onClose();
    if (!validate()) return;

    run(async () => {
      try {
        const payload: CreateUserRequest = {
          fullName: formData.fullName,
          email: formData.email,
          dni: formData.dni,
          phoneNumber: formData.phoneNumber,
          roleId: CONDUCTOR_ROLE_ID,
          branchOfficeId: formData.branchOfficeId,
          supplierId: null, // Los conductores no pertenecen a proveedores
        };

        if (formData.password) {
          payload.password = formData.password;
        }

        if (mode === "create") {
          await userService.createUser(payload);
          showToast("success", "Conductor creado", "El conductor ha sido registrado exitosamente.");
        } else if (mode === "edit" && initialData) {
          await userService.updateUser(initialData.id, payload);
          showToast("success", "Conductor actualizado", "Los datos han sido guardados.");
        }
        
        onSaved();
        onClose();
      } catch (err: any) {
        console.error(err);
        showToast("error", "Error", err.message || "Ocurrió un problema al guardar el conductor.");
      }
    });
  };

  const isReadOnly = mode === "view";

  const selectClasses = `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
    isReadOnly || loadingBranches 
      ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400' 
      : 'bg-white border-gray-300 text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700'
  } ${errors.branchOfficeId ? 'border-error-500 text-error-800 focus:ring-error-500/10' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
          {mode === "create" && "Registrar Nuevo Conductor"}
          {mode === "edit" && "Editar Conductor"}
          {mode === "view" && "Detalles del Conductor"}
        </h3>
        {mode === "view" && (
          <Badge size="sm" color="success">
            Cuenta Activa
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
          <Input
            placeholder="Ej. Juan Pérez"
            value={formData.fullName}
            onChange={(e: any) => handleChange("fullName", e.target.value)}
            disabled={isReadOnly}
            error={!!errors.fullName}
            hint={errors.fullName}
          />
        </div>
        
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">DNI</label>
          <Input
            placeholder="Ej. 12345678"
            value={formData.dni}
            onChange={(e: any) => handleChange("dni", e.target.value)}
            disabled={isReadOnly}
            error={!!errors.dni}
            hint={errors.dni}
          />
        </div>
        
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
          <Input
            placeholder="Ej. 70000000"
            value={formData.phoneNumber}
            onChange={(e: any) => handleChange("phoneNumber", e.target.value)}
            disabled={isReadOnly}
            error={!!errors.phoneNumber}
            hint={errors.phoneNumber}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
          <Input
            type="email"
            placeholder="juan.perez@ejemplo.com"
            value={formData.email}
            onChange={(e: any) => handleChange("email", e.target.value)}
            disabled={isReadOnly}
            error={!!errors.email}
            hint={errors.email}
          />
        </div>

        {mode !== "view" && (
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === "create" ? "Contraseña" : "Nueva Contraseña (opcional)"}
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e: any) => handleChange("password", e.target.value)}
              error={!!errors.password}
              hint={errors.password}
            />
          </div>
        )}

        <div className="sm:col-span-2 mt-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sucursal Base Asignada <span className="text-error-500">*</span>
          </label>
          <select
            className={selectClasses}
            value={formData.branchOfficeId}
            onChange={(e) => handleChange("branchOfficeId", e.target.value)}
            disabled={isReadOnly || loadingBranches}
          >
            <option value="" disabled>
              {loadingBranches ? "Cargando sucursales..." : "Seleccione una sucursal"}
            </option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.city} ({b.code})</option>
            ))}
          </select>
          {errors.branchOfficeId && (
            <p className="mt-1.5 text-xs text-error-500">{errors.branchOfficeId}</p>
          )}
          <p className="mt-1.5 text-xs text-gray-500">
            El conductor solo podrá operar y ser asignado a envíos desde esta sucursal.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose} disabled={pending}>
          {mode === "view" ? "Cerrar" : "Cancelar"}
        </Button>
        {mode !== "view" && (
          <Button type="submit" disabled={pending} className="bg-brand-500 text-white hover:bg-brand-600 border-transparent">
            {pending ? "Guardando..." : "Guardar Conductor"}
          </Button>
        )}
      </div>
    </form>
  );
}

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Role } from "@/services/roleService";

interface RoleFormModalProps {
  role?: Role | null;
  isSaving: boolean;
  onSave: (data: { name: string; description: string }) => void;
  onCancel: () => void;
  error?: string | null;
}

export default function RoleFormModal({
  role,
  isSaving,
  onSave,
  onCancel,
  error,
}: RoleFormModalProps) {
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    if (role) {
      setFormData({ name: role.name, description: role.description });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {role ? "Editar Rol" : "Crear Nuevo Rol"}
        </h4>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-800 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label required>Nombre del Rol</Label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej. Operador"
            required
            disabled={isSaving}
          />
        </div>
        <div>
          <Label>Descripción</Label>
          <Input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Breve descripción del rol"
            disabled={isSaving}
          />
        </div>
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Rol"}
          </Button>
        </div>
      </form>
    </div>
  );
}

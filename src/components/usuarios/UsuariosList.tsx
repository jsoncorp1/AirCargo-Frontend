import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { User } from "@/services/userService";
import { PencilIcon, TrashBinIcon } from "@/icons";

interface UsuariosListProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
            <div className="h-3 w-44 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-5 py-4">
        <div className="h-4 w-28 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-5 py-4">
        <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-5 py-4">
        <div className="ml-auto flex justify-end gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function UsuariosList({
  users,
  loading,
  onEdit,
  onDelete,
}: UsuariosListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Usuario / Correo
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Rol
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Sucursal / Proveedor
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
              >
                Acciones
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isProveedor =
                  user.roleName?.toLowerCase().includes("empresa") ||
                  user.roleName?.toLowerCase().includes("proveedor");

                // Asignar un color de badge simple basado en el rol de forma determinista o semántica
                let badgeColor: "success" | "warning" | "error" | "primary" | "info" = "info";
                if (user.roleName?.toLowerCase().includes("admin")) badgeColor = "error";
                else if (user.roleName?.toLowerCase().includes("conductor")) badgeColor = "success";
                else if (isProveedor) badgeColor = "primary";
                else if (user.roleName?.toLowerCase().includes("operador")) badgeColor = "warning";

                return (
                  <TableRow key={user.id} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white/90">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email} {user.phoneNumber ? ` • ${user.phoneNumber}` : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <Badge size="sm" color={badgeColor}>
                        {user.roleName || "Sin Rol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="text-sm">
                        {isProveedor ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-brand-500 font-semibold uppercase tracking-wider">Proveedor</span>
                            <span className="text-gray-700 dark:text-gray-300">{user.supplierName || "—"}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Sucursal</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {user.branchOfficeCode ? `${user.branchOfficeCode} - ${user.branchOfficeCity}` : "Sin sucursal"}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                          title="Editar Usuario"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                          title="Eliminar Usuario"
                        >
                          <TrashBinIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

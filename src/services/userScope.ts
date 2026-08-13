// Ámbito (proveedor / sucursal / global) que corresponde a cada rol.
//
// Espejo de `UserScopeRules.Validate` del backend: si el front manda un campo de
// ámbito que no corresponde al rol, el POST/PUT de usuarios responde 400
// (`user.scope.notallowed`, `user.supplierid.notallowed`, …). Tener la regla en
// un único lugar evita que cada formulario la reinvente.

export const ROLE_NAMES = {
  superAdmin: 'superadmin',
  admin: 'admin',
  conductor: 'conductor',
  usuarioEmpresa: 'usuarioempresa',
} as const;

// 'global'   → superadmin: ni proveedor ni sucursal (ve todo).
// 'supplier' → usuarioempresa: proveedor obligatorio, sucursal prohibida.
// 'branch'   → admin/conductor: sucursal obligatoria, proveedor prohibido.
// 'unknown'  → rol sin regla; el backend lo rechaza con `user.role.scopeundefined`.
export type RoleScope = 'global' | 'supplier' | 'branch' | 'unknown';

export const normalizeRoleName = (roleName?: string | null): string =>
  (roleName ?? '').trim().toLowerCase();

export function resolveRoleScope(roleName?: string | null): RoleScope {
  // Comparación exacta a propósito: "superadmin" contiene "admin", así que un
  // `includes` clasificaría al superadmin como rol de sucursal.
  switch (normalizeRoleName(roleName)) {
    case ROLE_NAMES.superAdmin:
      return 'global';
    case ROLE_NAMES.usuarioEmpresa:
      return 'supplier';
    case ROLE_NAMES.admin:
    case ROLE_NAMES.conductor:
      return 'branch';
    default:
      return 'unknown';
  }
}

export const isSuperAdminRole = (roleName?: string | null): boolean =>
  resolveRoleScope(roleName) === 'global';

export const roleRequiresSupplier = (roleName?: string | null): boolean =>
  resolveRoleScope(roleName) === 'supplier';

export const roleRequiresBranchOffice = (roleName?: string | null): boolean =>
  resolveRoleScope(roleName) === 'branch';

/**
 * Deja en el payload solo el campo de ámbito que le corresponde al rol y anula
 * el otro. Sin esto, cambiar de rol en un formulario ya cargado (p. ej. de
 * `admin` a `usuarioempresa`) arrastra la sucursal vieja y el backend rechaza
 * con `user.branchofficeid.notallowed`.
 */
export function scopeFieldsForRole(
  roleName: string | null | undefined,
  values: { supplierId?: string | null; branchOfficeId?: string | null }
): { supplierId: string | null; branchOfficeId: string | null } {
  switch (resolveRoleScope(roleName)) {
    case 'supplier':
      return { supplierId: values.supplierId || null, branchOfficeId: null };
    case 'branch':
      return { supplierId: null, branchOfficeId: values.branchOfficeId || null };
    // 'global' y 'unknown': el superadmin no lleva ámbito, y para un rol sin
    // regla mandar campos vacíos deja que el backend explique el problema.
    default:
      return { supplierId: null, branchOfficeId: null };
  }
}

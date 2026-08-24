export const ROLES = {
  OWNER: "OWNER",
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  MEMBER: "MEMBER",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/** Full club management (members, payments, settings, events, etc.). */
export const ADMIN_ROLES: readonly RoleName[] = [ROLES.OWNER, ROLES.SUPER_ADMIN, ROLES.ADMIN];
/** Can enter the admin area (adds Staff, who assist with events & bookings). */
export const STAFF_ROLES: readonly RoleName[] = [
  ROLES.OWNER,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
];
/** Can create / edit / disable admin & staff accounts. */
export const ADMIN_MANAGER_ROLES: readonly RoleName[] = [ROLES.OWNER, ROLES.SUPER_ADMIN];

export function isAdmin(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role as RoleName);
}

export function isStaff(role?: string | null): boolean {
  return !!role && STAFF_ROLES.includes(role as RoleName);
}

/** Owner or Super Admin — the only roles that manage other admin accounts. */
export function canManageAdmins(role?: string | null): boolean {
  return !!role && ADMIN_MANAGER_ROLES.includes(role as RoleName);
}

export function hasRole(role: string | null | undefined, allowed: readonly string[]): boolean {
  return !!role && allowed.includes(role);
}

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Club Owner",
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  STAFF: "Staff",
  MEMBER: "Member",
};

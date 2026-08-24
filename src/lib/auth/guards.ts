import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import { isAdmin, isStaff, canManageAdmins } from "./rbac";

/** Require an authenticated user; redirect to login otherwise. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require an ACTIVE member (approved). Pending/rejected land on the dashboard status screen. */
export async function requireActiveMember() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountStatus !== "ACTIVE") redirect("/dashboard");
  return user;
}

/** Staff-level access (owner/super-admin/admin/staff) — the admin area. */
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isStaff(user.role.name)) redirect("/dashboard");
  return user;
}

/** Full admin access (owner/super-admin/admin). */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role.name)) redirect("/dashboard");
  return user;
}

/** Owner / Super Admin only — managing admin & staff accounts. */
export async function requireOwnerOrSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAdmins(user.role.name)) redirect("/admin");
  return user;
}

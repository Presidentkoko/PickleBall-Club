import "server-only";
import { getCurrentUser } from "./session";
import { isAdmin, isStaff, canManageAdmins } from "./rbac";
import { ApiError } from "@/lib/api";

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("Not authenticated", 401);
  return user;
}

/** Member actions (join, book, register a team) require an approved account. */
export async function requireApiActiveMember() {
  const user = await requireApiUser();
  if (user.accountStatus !== "ACTIVE") {
    throw new ApiError("Your membership is pending approval.", 403);
  }
  return user;
}

export async function requireApiStaff() {
  const user = await requireApiUser();
  if (!isStaff(user.role.name)) throw new ApiError("You don't have permission to do that.", 403);
  return user;
}

export async function requireApiAdmin() {
  const user = await requireApiUser();
  if (!isAdmin(user.role.name)) throw new ApiError("You don't have permission to do that.", 403);
  return user;
}

export async function requireApiOwnerOrSuperAdmin() {
  const user = await requireApiUser();
  if (!canManageAdmins(user.role.name)) {
    throw new ApiError("Only the Club Owner or a Super Admin can do that.", 403);
  }
  return user;
}

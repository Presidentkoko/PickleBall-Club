import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated", 401);

  return ok({
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    skillLevel: user.skillLevel,
    role: user.role.name,
    isActive: user.isActive,
  });
}

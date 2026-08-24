import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { authenticate } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import { ok, fail, handleApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000)) {
      return fail("Too many attempts. Please wait a minute and try again.", 429);
    }
    const body = await req.json();
    const { identifier, password } = loginSchema.parse(body);

    const user = await authenticate(identifier, password);
    if (!user) return fail("Invalid email/username or password.", 401);

    await createSession({
      sub: user.id,
      email: user.email,
      role: user.role.name,
      name: `${user.firstName} ${user.lastName}`,
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await logAudit({
      userId: user.id,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
    });

    return ok({ id: user.id, role: user.role.name });
  } catch (error) {
    return handleApiError(error);
  }
}

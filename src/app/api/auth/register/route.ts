import { NextRequest } from "next/server";
import { memberRegistrationSchema } from "@/lib/validations/register";
import { registerMemberApplication } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import { ok, fail, handleApiError } from "@/lib/api";
import { notifyAdmins } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`register:${clientIp(req)}`, 5, 60_000)) {
      return fail("Too many attempts. Please wait a minute and try again.", 429);
    }

    const input = memberRegistrationSchema.parse(await req.json());
    const user = await registerMemberApplication(input);

    // Log them in so they can track their application status.
    await createSession({
      sub: user.id,
      email: user.email,
      role: user.role.name,
      name: `${user.firstName} ${user.lastName}`,
    });

    await notifyAdmins({
      type: "MEMBERSHIP",
      title: "New membership application",
      message: `${user.firstName} ${user.lastName} submitted a membership application.`,
      link: "/admin/applications",
    });
    await logAudit({
      userId: user.id,
      action: "MEMBER_APPLIED",
      entity: "User",
      entityId: user.id,
      description: user.email,
    });

    return ok({ id: user.id, role: user.role.name }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/auth/api-guard";
import { ok, handleApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const schema = z.object({ key: z.string().min(1).max(80), value: z.unknown() });

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireApiAdmin();
    const { key, value } = schema.parse(await req.json());

    await prisma.setting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });

    await logAudit({ userId: admin.id, action: "SETTING_UPDATED", entity: "Setting", entityId: key });
    return ok({ key });
  } catch (error) {
    return handleApiError(error);
  }
}

import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AuditParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

/** Write an audit log entry. Never throws — auditing must not break the main flow. */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    console.error("[AUDIT] failed to write log:", err);
  }
}

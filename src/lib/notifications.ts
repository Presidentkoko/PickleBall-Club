import "server-only";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

type NotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

export async function notifyUser(userId: string, data: NotificationInput) {
  await prisma.notification.create({ data: { userId, ...data } });
}

/** Notify all active admins and owners (e.g. new membership, payment uploaded). */
export async function notifyAdmins(data: NotificationInput) {
  const admins = await prisma.user.findMany({
    where: { role: { name: { in: ["ADMIN", "OWNER"] } }, isActive: true },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((admin) => ({ userId: admin.id, ...data })),
  });
}

/** Notify all active members (e.g. a new published announcement). */
export async function notifyAllMembers(data: NotificationInput) {
  const members = await prisma.user.findMany({
    where: { role: { name: "MEMBER" }, isActive: true },
    select: { id: true },
  });
  if (members.length === 0) return;
  await prisma.notification.createMany({
    data: members.map((member) => ({ userId: member.id, ...data })),
  });
}

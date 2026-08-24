import "server-only";
import { prisma } from "@/lib/prisma";

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return (setting?.value as T | undefined) ?? null;
}

export type ClubInfo = {
  name: string;
  shortName?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
};

export type PaymentAccounts = {
  gcash?: { name?: string; number?: string };
  bank?: { bankName?: string; accountName?: string; accountNumber?: string };
};

export function getClubInfo() {
  return getSetting<ClubInfo>("club.info");
}

export function getMembershipFees() {
  return getSetting<Record<string, number>>("membership.fees");
}

export function getPaymentAccounts() {
  return getSetting<PaymentAccounts>("payment.accounts");
}

import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { hashPassword, verifyPassword } from "./password";
import { ROLES } from "./rbac";
import { getMembershipFees } from "@/lib/settings";
import { persistImage } from "@/lib/storage";
import type { MemberRegistrationInput } from "@/lib/validations/register";

/**
 * Public membership application: creates a MEMBER account with
 * Account Status = PENDING_VERIFICATION plus a pending Membership and Payment.
 */
export async function registerMemberApplication(input: MemberRegistrationInput) {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError("An account with this email already exists.", 409);

  const memberRole = await prisma.role.findUnique({ where: { name: ROLES.MEMBER } });
  if (!memberRole) throw new ApiError("Roles are not initialized. Run the database seed.", 500);

  const fees = (await getMembershipFees()) ?? {};
  const fee = fees[input.type] ?? 0;

  const passwordHash = await hashPassword(input.password);
  const proofUrl = input.proofDataUrl
    ? await persistImage(input.proofDataUrl, "svpc/payments")
    : undefined;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName: input.firstName.trim(),
        middleName: input.middleName?.trim() || null,
        lastName: input.lastName.trim(),
        birthdate: new Date(input.birthdate),
        gender: input.gender,
        phone: input.phone,
        address: input.address,
        emergencyContact: input.emergencyContact,
        emergencyContactPhone: input.emergencyContactPhone,
        emergencyContactRelation: input.emergencyContactRelation,
        skillLevel: input.skillLevel,
        playingExperience: input.playingExperience,
        preferredDays: input.preferredDays ?? [],
        preferredTime: input.preferredTime,
        roleId: memberRole.id,
        accountStatus: "PENDING_VERIFICATION",
      },
      include: { role: true },
    });

    const membership = await tx.membership.create({
      data: { userId: user.id, type: input.type, status: "PENDING", fee },
    });

    await tx.payment.create({
      data: {
        userId: user.id,
        purpose: "MEMBERSHIP",
        amount: fee,
        method: input.method,
        referenceNumber: input.referenceNumber,
        proofUrl,
        status: "PENDING",
        membershipId: membership.id,
      },
    });

    return user;
  });
}

/** Verify credentials by email OR username. Returns the user, or null if invalid. */
export async function authenticate(identifier: string, password: string) {
  const id = identifier.toLowerCase().trim();

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: id }, { username: id }] },
    include: { role: true },
  });
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  if (!user.isActive) {
    throw new ApiError("Your account has been deactivated. Please contact the club admin.", 403);
  }

  return user;
}

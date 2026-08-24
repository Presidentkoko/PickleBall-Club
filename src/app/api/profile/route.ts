import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/api-guard";
import { profileSchema } from "@/lib/validations/profile";
import { persistImage } from "@/lib/storage";
import { ok, handleApiError } from "@/lib/api";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const input = profileSchema.parse(await req.json());

    const avatarUrl = input.avatarDataUrl
      ? await persistImage(input.avatarDataUrl, "svpc/avatars")
      : undefined;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone,
        birthdate: input.birthdate ? new Date(input.birthdate) : undefined,
        gender: input.gender,
        address: input.address,
        emergencyContact: input.emergencyContact,
        emergencyContactPhone: input.emergencyContactPhone,
        skillLevel: input.skillLevel,
        preferredTime: input.preferredTime,
        bio: input.bio,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

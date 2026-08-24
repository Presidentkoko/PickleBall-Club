import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  phone: z.string().max(30).optional(),
  birthdate: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  address: z.string().max(200).optional(),
  emergencyContact: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"]).optional(),
  preferredTime: z.enum(["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"]).optional(),
  bio: z.string().max(500).optional(),
  avatarDataUrl: z.string().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

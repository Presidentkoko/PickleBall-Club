import { z } from "zod";

export const adminCreateMemberSchema = z.object({
  // Personal
  firstName: z.string().min(1, "First name is required").max(60),
  middleName: z.string().max(60).optional(),
  lastName: z.string().min(1, "Last name is required").max(60),
  email: z.email("Enter a valid email"),
  phone: z.string().max(30).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  birthdate: z.string().optional(),
  address: z.string().max(200).optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"]).optional(),
  // Membership
  membershipType: z.enum([
    "MONTHLY",
    "QUARTERLY",
    "SEMI_ANNUAL",
    "ANNUAL",
    "COMPLIMENTARY",
    "LIFETIME",
  ]),
  membershipNumber: z.string().max(40).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // Admin options
  accountStatus: z.enum(["ACTIVE", "PENDING_VERIFICATION"]),
  paymentStatus: z.enum(["VERIFIED", "PENDING", "NONE"]),
  internalNotes: z.string().max(1000).optional(),
});
export type AdminCreateMemberInput = z.infer<typeof adminCreateMemberSchema>;

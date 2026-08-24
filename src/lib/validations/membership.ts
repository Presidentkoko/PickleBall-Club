import { z } from "zod";

export const membershipApplicationSchema = z
  .object({
    // Profile
    phone: z.string().min(5, "Phone number is required").max(30),
    birthdate: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
    address: z.string().max(200).optional(),
    emergencyContact: z.string().max(100).optional(),
    emergencyContactPhone: z.string().max(30).optional(),
    skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"]),
    preferredTime: z.enum(["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"]).optional(),
    avatarDataUrl: z.string().optional(),

    // Membership
    type: z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]),

    // Payment
    method: z.enum(["GCASH", "BANK_TRANSFER", "CASH"]),
    referenceNumber: z.string().max(60).optional(),
    proofDataUrl: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.method !== "CASH" && !val.proofDataUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["proofDataUrl"],
        message: "Please upload your proof of payment",
      });
    }
    if (val.method !== "CASH" && !val.referenceNumber) {
      ctx.addIssue({
        code: "custom",
        path: ["referenceNumber"],
        message: "Reference number is required",
      });
    }
  });

export type MembershipApplicationInput = z.infer<typeof membershipApplicationSchema>;

export const MEMBERSHIP_TYPE_LABELS: Record<string, { label: string; months: number }> = {
  MONTHLY: { label: "Monthly", months: 1 },
  QUARTERLY: { label: "Quarterly", months: 3 },
  SEMI_ANNUAL: { label: "Semi-Annual", months: 6 },
  ANNUAL: { label: "Annual", months: 12 },
};

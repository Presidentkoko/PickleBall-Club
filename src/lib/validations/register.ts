import { z } from "zod";

export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export const WEEKDAY_LABELS: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

export const PLAYING_EXPERIENCE_OPTIONS = [
  "Less than 6 months",
  "6 months – 1 year",
  "1 – 3 years",
  "3 – 5 years",
  "5+ years",
] as const;

export const memberRegistrationSchema = z
  .object({
    // Account
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "At least 8 characters").max(100),
    confirmPassword: z.string(),
    // Personal
    firstName: z.string().min(1, "First name is required").max(60),
    middleName: z.string().max(60).optional(),
    lastName: z.string().min(1, "Last name is required").max(60),
    birthdate: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
    phone: z.string().min(5, "Mobile number is required").max(30),
    address: z.string().min(1, "Address is required").max(200),
    // Emergency contact
    emergencyContact: z.string().min(1, "Emergency contact name is required").max(100),
    emergencyContactPhone: z.string().min(1, "Emergency contact number is required").max(30),
    emergencyContactRelation: z.string().min(1, "Relationship is required").max(60),
    // Playing profile
    skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"]),
    playingExperience: z.string().min(1, "Playing experience is required").max(60),
    preferredDays: z.array(z.enum(WEEKDAYS)).optional(),
    preferredTime: z.enum(["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"]).optional(),
    // Membership & payment
    type: z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]),
    method: z.enum(["GCASH", "BANK_TRANSFER", "CASH"]),
    referenceNumber: z.string().max(60).optional(),
    proofDataUrl: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((val, ctx) => {
    if (val.method !== "CASH" && !val.proofDataUrl) {
      ctx.addIssue({ code: "custom", path: ["proofDataUrl"], message: "Please upload your proof of payment" });
    }
    if (val.method !== "CASH" && !val.referenceNumber) {
      ctx.addIssue({ code: "custom", path: ["referenceNumber"], message: "Reference number is required" });
    }
  });

export type MemberRegistrationInput = z.infer<typeof memberRegistrationSchema>;

import { z } from "zod";

export const adminAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  email: z.email("Enter a valid email"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF"]),
});
export type AdminAccountInput = z.infer<typeof adminAccountSchema>;

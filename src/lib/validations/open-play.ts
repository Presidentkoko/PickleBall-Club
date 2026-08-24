import { z } from "zod";

export const openPlaySchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(1000).optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required").max(160),
  maxPlayers: z.number().int().min(2, "At least 2 players").max(200),
  fee: z.number().min(0).max(100000),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"]).optional(),
  bannerDataUrl: z.string().optional(),
});

export type OpenPlayInput = z.infer<typeof openPlaySchema>;

/** Combine a "YYYY-MM-DD" date and "HH:mm" time into a Date. */
export function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

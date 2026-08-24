import { z } from "zod";

export const bookingRequestSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  courtId: z.string().optional(),
  purpose: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

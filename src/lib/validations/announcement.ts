import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  content: z.string().min(1, "Content is required").max(5000),
  type: z.enum(["NEWS", "HIGHLIGHT", "EVENT", "PROMO"]),
  imageDataUrl: z.string().optional(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const ANNOUNCEMENT_TYPE_LABELS: Record<string, string> = {
  NEWS: "News",
  HIGHLIGHT: "Highlight",
  EVENT: "Event",
  PROMO: "Promo",
};

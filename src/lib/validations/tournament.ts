import { z } from "zod";

export const tournamentSchema = z.object({
  name: z.string().min(1, "Name is required").max(140),
  description: z.string().max(2000).optional(),
  division: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "MIXED", "MENS", "WOMENS"]),
  format: z.enum(["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN"]),
  date: z.string().min(1, "Date is required"),
  venue: z.string().min(1, "Venue is required").max(160),
  entryFee: z.number().min(0).max(1_000_000),
  registrationDeadline: z.string().optional(),
  maxTeams: z.number().int().min(2).max(128).optional(),
  teamSize: z.number().int().min(1).max(6),
  rules: z.string().max(4000).optional(),
  prizes: z.string().max(2000).optional(),
  bannerDataUrl: z.string().optional(),
});
export type TournamentInput = z.infer<typeof tournamentSchema>;

export const DIVISION_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  MIXED: "Mixed",
  MENS: "Men's",
  WOMENS: "Women's",
};

export const FORMAT_LABELS: Record<string, string> = {
  SINGLE_ELIMINATION: "Single Elimination",
  DOUBLE_ELIMINATION: "Double Elimination",
  ROUND_ROBIN: "Round Robin",
};

/** Add a team to a tournament (admin). */
export const teamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(120),
  players: z
    .array(z.string().min(1).max(120))
    .min(1, "Add at least one player")
    .max(6),
  seed: z.number().int().min(1).optional(),
});
export type TeamInput = z.infer<typeof teamSchema>;

/** Record a match score (best-of games summarized as games won). */
export const scoreSchema = z.object({
  scoreA: z.number().int().min(0).max(99),
  scoreB: z.number().int().min(0).max(99),
});
export type ScoreInput = z.infer<typeof scoreSchema>;

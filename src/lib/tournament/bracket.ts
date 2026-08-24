/**
 * Tournament bracket generation (pure functions, no DB).
 * Returns match specs with 1-based `matchNumber`; `nextMatchNumber` links the
 * winner's destination. The persistence layer maps matchNumber → id afterward.
 */

export type GeneratedMatch = {
  round: number;
  matchNumber: number;
  bracket: "WINNERS" | "ROUND_ROBIN";
  teamAId: string | null;
  teamBId: string | null;
  winnerId: string | null;
  status: "PENDING" | "BYE";
  nextMatchNumber: number | null;
};

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Standard bracket seeding order (1 vs N, etc.) for a power-of-two size. */
function seedOrder(size: number): number[] {
  let order = [1, 2];
  const rounds = Math.log2(size);
  for (let r = 1; r < rounds; r++) {
    const sum = order.length * 2 + 1;
    const next: number[] = [];
    for (const s of order) {
      next.push(s);
      next.push(sum - s);
    }
    order = next;
  }
  return order;
}

export function generateSingleElimination(teamIds: string[]): GeneratedMatch[] {
  const n = teamIds.length;
  if (n < 2) return [];
  const size = nextPow2(n);
  const rounds = Math.log2(size);
  const positions = seedOrder(size).map((s) => (s <= n ? teamIds[s - 1] : null));

  const byRound: GeneratedMatch[][] = [];
  let num = 1;
  for (let r = 1; r <= rounds; r++) {
    const count = size / Math.pow(2, r);
    const arr: GeneratedMatch[] = [];
    for (let j = 0; j < count; j++) {
      arr.push({
        round: r,
        matchNumber: num++,
        bracket: "WINNERS",
        teamAId: null,
        teamBId: null,
        winnerId: null,
        status: "PENDING",
        nextMatchNumber: null,
      });
    }
    byRound.push(arr);
  }

  // Seed round 1
  for (let j = 0; j < size / 2; j++) {
    byRound[0][j].teamAId = positions[2 * j];
    byRound[0][j].teamBId = positions[2 * j + 1];
  }

  // Link winners forward
  for (let r = 0; r < rounds - 1; r++) {
    for (let j = 0; j < byRound[r].length; j++) {
      byRound[r][j].nextMatchNumber = byRound[r + 1][Math.floor(j / 2)].matchNumber;
    }
  }

  const all = byRound.flat();
  const byNum = new Map(all.map((m) => [m.matchNumber, m]));

  // Resolve byes — advance the lone team into the next round
  for (const m of byRound[0]) {
    const lone =
      m.teamAId && !m.teamBId ? m.teamAId : !m.teamAId && m.teamBId ? m.teamBId : null;
    if (lone) {
      m.winnerId = lone;
      m.status = "BYE";
      if (m.nextMatchNumber) {
        const nm = byNum.get(m.nextMatchNumber);
        if (nm) {
          if (!nm.teamAId) nm.teamAId = lone;
          else nm.teamBId = lone;
        }
      }
    }
  }

  return all;
}

export function generateRoundRobin(teamIds: string[]): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  let num = 1;
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({
        round: 1,
        matchNumber: num++,
        bracket: "ROUND_ROBIN",
        teamAId: teamIds[i],
        teamBId: teamIds[j],
        winnerId: null,
        status: "PENDING",
        nextMatchNumber: null,
      });
    }
  }
  return matches;
}

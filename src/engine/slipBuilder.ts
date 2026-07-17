// slip_builder: scan several fixtures, keep only the value legs, and combine
// them into a parlay with an honest combined edge.
import type { SlipBuilderInputT, ValueLeg } from "../types.js";
import { runValueScan } from "./valueScan.js";

export interface SlipLeg extends ValueLeg {
  home: string;
  away: string;
}

export interface SlipResult {
  legs: SlipLeg[];
  combined: {
    modelProb: number; // joint model probability (assumes independence)
    decimalOdds: number; // product of decimal odds
    expectedValue: number; // EV per unit on the combined slip
    edgePct: number;
  } | null;
  considered: number;
  note: string;
}

const round = (x: number, n = 4): number => {
  const f = 10 ** n;
  return Math.round(x * f) / f;
};

export async function runSlipBuilder(input: SlipBuilderInputT): Promise<SlipResult> {
  const candidates: SlipLeg[] = [];
  for (const m of input.matches) {
    const scan = await runValueScan({
      home: m.home,
      away: m.away,
      neutral: m.neutral,
      market: m.market,
      kellyCap: 0.25,
    });
    const best = scan.best;
    if (best && best.edgePct >= input.minEdgePct) {
      candidates.push({ ...best, home: scan.match.home, away: scan.match.away });
    }
  }

  candidates.sort((a, b) => b.edgePct - a.edgePct);
  const legs = candidates.slice(0, input.maxLegs);

  if (legs.length === 0) {
    return {
      legs: [],
      combined: null,
      considered: input.matches.length,
      note: `No legs cleared the ${input.minEdgePct}% edge threshold. Discipline over action — skip the slip.`,
    };
  }

  const modelProb = legs.reduce((p, l) => p * l.modelProb, 1);
  const decimalOdds = legs.reduce((p, l) => p * l.decimalOdds, 1);
  const expectedValue = modelProb * decimalOdds - 1;
  const edgePct = (modelProb * decimalOdds - 1) * 100;

  return {
    legs,
    combined: {
      modelProb: round(modelProb),
      decimalOdds: round(decimalOdds, 3),
      expectedValue: round(expectedValue),
      edgePct: round(edgePct, 2),
    },
    considered: input.matches.length,
    note:
      legs.length > 1
        ? "Combined edge assumes leg independence; correlated legs (same match/tournament) inflate it — size down."
        : "Single value leg selected.",
  };
}

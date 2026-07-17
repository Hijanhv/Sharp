import { z } from "zod";

// ── Shared domain types ─────────────────────────────────────────────────────

export type Outcome = "home" | "draw" | "away";

export interface OutcomeProbs {
  home: number;
  draw: number;
  away: number;
}

export interface FairOdds {
  home: number;
  draw: number;
  away: number;
}

export interface ScoreLine {
  home: number;
  away: number;
  prob: number;
}

/** Result of pricing a single football match with the Dixon-Coles model. */
export interface MatchPricing {
  home: string;
  away: string;
  neutral: boolean;
  lambda: { home: number; away: number }; // expected goals
  probs: OutcomeProbs; // ALWAYS normalized to sum 1
  fairOdds: FairOdds; // 1 / prob
  topScores: ScoreLine[];
  expectedGoals: number;
  bttsProb: number; // both teams to score
  over25Prob: number; // over 2.5 goals
  confidence: "high" | "medium" | "low";
  method: string;
}

export interface ValueLeg {
  outcome: Outcome;
  label: string;
  modelProb: number; // our calibrated probability
  marketProb: number; // de-vigged market probability
  marketPrice: number; // what you pay (0..1) == 1/decimalOdds
  decimalOdds: number; // what the market pays
  edgePct: number; // (modelProb / marketPrice - 1) * 100
  expectedValue: number; // EV per 1 unit staked
  kellyFraction: number; // fraction of bankroll (full Kelly, capped at 0)
  verdict: "strong-value" | "value" | "fair" | "no-value";
}

// ── Zod input schemas (shared by REST + MCP) ────────────────────────────────

export const FairOddsInput = z.object({
  home: z.string().min(1, "home team required"),
  away: z.string().min(1, "away team required"),
  neutral: z.boolean().optional().default(true),
});
export type FairOddsInputT = z.infer<typeof FairOddsInput>;

// A market can be supplied explicitly (decimal odds OR implied prices), or by a
// Polymarket query/slug that Sharp resolves live.
export const MarketInput = z
  .object({
    polymarket: z.string().optional(), // slug or search query
    decimalOdds: z
      .object({ home: z.number().positive(), draw: z.number().positive().optional(), away: z.number().positive() })
      .optional(),
    prices: z
      .object({ home: z.number().positive(), draw: z.number().positive().optional(), away: z.number().positive() })
      .optional(), // implied prices 0..1 (may include vig)
  })
  .refine((m) => m.polymarket || m.decimalOdds || m.prices, {
    message: "provide one of: polymarket, decimalOdds, or prices",
  });

export const ValueScanInput = z.object({
  home: z.string().min(1),
  away: z.string().min(1),
  neutral: z.boolean().optional().default(true),
  market: MarketInput,
  bankroll: z.number().positive().optional(),
  kellyCap: z.number().min(0).max(1).optional().default(0.25), // fractional Kelly cap
});
export type ValueScanInputT = z.infer<typeof ValueScanInput>;

export const SlipBuilderInput = z.object({
  matches: z
    .array(
      z.object({
        home: z.string().min(1),
        away: z.string().min(1),
        neutral: z.boolean().optional().default(true),
        market: MarketInput,
      }),
    )
    .min(1)
    .max(10),
  minEdgePct: z.number().optional().default(3),
  maxLegs: z.number().int().positive().optional().default(4),
});
export type SlipBuilderInputT = z.infer<typeof SlipBuilderInput>;

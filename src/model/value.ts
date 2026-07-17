// De-vigging and Kelly staking — the "value" half of Sharp.
//
// A bookmaker/market price bakes in a margin (overround): the implied
// probabilities sum to > 1. To find genuine value we compare our calibrated
// model probability against the *de-vigged* market probability, then size the
// bet with the Kelly criterion. Every number here is a pure function.

import type { Outcome, OutcomeProbs, ValueLeg } from "../types.js";

/** Convert decimal odds to an implied (vig-inclusive) probability. */
export function impliedFromDecimal(decimalOdds: number): number {
  return 1 / decimalOdds;
}

/**
 * Remove the margin from a set of implied prices so they sum to 1
 * (proportional / "multiplicative" method).
 */
export function devig(prices: Partial<Record<Outcome, number>>): Partial<Record<Outcome, number>> {
  const entries = Object.entries(prices).filter(([, v]) => typeof v === "number" && v! > 0) as [Outcome, number][];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total <= 0) return prices;
  const out: Partial<Record<Outcome, number>> = {};
  for (const [k, v] of entries) out[k] = v / total;
  return out;
}

/**
 * Kelly fraction for a back bet.
 *   f* = (b*p - q) / b,  b = decimalOdds - 1, p = win prob, q = 1 - p
 * Negative results (no edge) are clamped to 0.
 */
export function kelly(modelProb: number, decimalOdds: number): number {
  const b = decimalOdds - 1;
  if (b <= 0) return 0;
  const q = 1 - modelProb;
  const f = (b * modelProb - q) / b;
  return Math.max(0, f);
}

function verdictFor(edgePct: number): ValueLeg["verdict"] {
  if (edgePct >= 8) return "strong-value";
  if (edgePct >= 3) return "value";
  if (edgePct > -3) return "fair";
  return "no-value";
}

const LABELS: Record<Outcome, string> = { home: "Home win", draw: "Draw", away: "Away win" };

/**
 * Score every outcome for value. `marketDecimal` are the decimal odds the
 * market offers per outcome; we de-vig them to get fair market probabilities,
 * then measure the model's edge over the *price you actually pay*.
 */
export function scoreValue(
  modelProbs: OutcomeProbs,
  marketDecimal: Partial<Record<Outcome, number>>,
  kellyCap = 0.25,
): ValueLeg[] {
  const impliedPrices: Partial<Record<Outcome, number>> = {};
  for (const [k, dec] of Object.entries(marketDecimal) as [Outcome, number][]) {
    impliedPrices[k] = impliedFromDecimal(dec);
  }
  const fairMarket = devig(impliedPrices);

  const legs: ValueLeg[] = [];
  for (const outcome of ["home", "draw", "away"] as Outcome[]) {
    const decimalOdds = marketDecimal[outcome];
    if (typeof decimalOdds !== "number" || decimalOdds <= 1) continue;
    const modelProb = modelProbs[outcome];
    const marketPrice = impliedPrices[outcome]!; // price you pay (vig-inclusive)
    const marketProb = fairMarket[outcome] ?? marketPrice; // de-vigged
    // Edge measured against the price paid: how much more likely we think it is.
    const edgePct = (modelProb / marketPrice - 1) * 100;
    const expectedValue = modelProb * decimalOdds - 1;
    const fullKelly = kelly(modelProb, decimalOdds);
    legs.push({
      outcome,
      label: LABELS[outcome],
      modelProb,
      marketProb,
      marketPrice,
      decimalOdds,
      edgePct,
      expectedValue,
      kellyFraction: Math.min(fullKelly, kellyCap),
      verdict: verdictFor(edgePct),
    });
  }
  legs.sort((a, b) => b.edgePct - a.edgePct);
  return legs;
}

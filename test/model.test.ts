import { describe, it, expect } from "vitest";
import {
  poissonPmf,
  buildScoreMatrix,
  outcomeProbs,
  topScores,
  bttsProb,
  over25Prob,
} from "../src/model/dixonColes.js";
import { devig, kelly, scoreValue, impliedFromDecimal } from "../src/model/value.js";

describe("Poisson", () => {
  it("pmf sums to ~1 over a wide support", () => {
    let s = 0;
    for (let k = 0; k <= 30; k++) s += poissonPmf(k, 1.6);
    expect(s).toBeCloseTo(1, 6);
  });
  it("mean of Poisson(λ) ≈ λ", () => {
    let mean = 0;
    for (let k = 0; k <= 40; k++) mean += k * poissonPmf(k, 2.1);
    expect(mean).toBeCloseTo(2.1, 4);
  });
});

describe("Dixon-Coles score matrix", () => {
  it("outcome probabilities ALWAYS sum to exactly 1 (the 125% bug fix)", () => {
    for (const [l, m] of [
      [1.8, 1.1],
      [0.4, 2.7],
      [3.2, 0.3],
      [1.35, 1.35],
    ] as [number, number][]) {
      const p = outcomeProbs(buildScoreMatrix(l, m));
      expect(p.home + p.draw + p.away).toBeCloseTo(1, 10);
      expect(p.home).toBeGreaterThan(0);
      expect(p.away).toBeGreaterThan(0);
    }
  });

  it("stronger attack shifts probability toward that side", () => {
    const strongHome = outcomeProbs(buildScoreMatrix(2.4, 0.8));
    const strongAway = outcomeProbs(buildScoreMatrix(0.8, 2.4));
    expect(strongHome.home).toBeGreaterThan(strongHome.away);
    expect(strongAway.away).toBeGreaterThan(strongAway.home);
  });

  it("top scores are sorted and plausible", () => {
    const sm = buildScoreMatrix(1.4, 1.1);
    const top = topScores(sm, 3);
    expect(top).toHaveLength(3);
    expect(top[0]!.prob).toBeGreaterThanOrEqual(top[1]!.prob);
    expect(top[1]!.prob).toBeGreaterThanOrEqual(top[2]!.prob);
  });

  it("btts and over2.5 are valid probabilities", () => {
    const sm = buildScoreMatrix(1.6, 1.3);
    expect(bttsProb(sm)).toBeGreaterThan(0);
    expect(bttsProb(sm)).toBeLessThan(1);
    expect(over25Prob(sm)).toBeGreaterThan(0);
    expect(over25Prob(sm)).toBeLessThan(1);
  });
});

describe("value math", () => {
  it("de-vig normalizes implied prices to sum 1", () => {
    const fair = devig({ home: 0.5, draw: 0.3, away: 0.35 }); // sums to 1.15 (15% vig)
    const total = (fair.home ?? 0) + (fair.draw ?? 0) + (fair.away ?? 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("impliedFromDecimal inverts odds", () => {
    expect(impliedFromDecimal(2)).toBeCloseTo(0.5, 10);
    expect(impliedFromDecimal(4)).toBeCloseTo(0.25, 10);
  });

  it("Kelly is positive only with genuine edge, and 0 without", () => {
    // model 60% vs 2.0 odds (implies 50%) -> positive edge
    expect(kelly(0.6, 2.0)).toBeGreaterThan(0);
    // model 40% vs 2.0 odds -> no edge
    expect(kelly(0.4, 2.0)).toBe(0);
  });

  it("scoreValue flags a mispriced favourite as value", () => {
    const legs = scoreValue({ home: 0.6, draw: 0.25, away: 0.15 }, { home: 2.1, draw: 3.4, away: 5.0 });
    const home = legs.find((l) => l.outcome === "home")!;
    // model 60% but price implies ~48% -> should be value with positive edge
    expect(home.edgePct).toBeGreaterThan(0);
    expect(["value", "strong-value"]).toContain(home.verdict);
    expect(home.kellyFraction).toBeGreaterThan(0);
  });
});

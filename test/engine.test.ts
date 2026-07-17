import { describe, it, expect } from "vitest";
import { priceMatch } from "../src/engine/pricing.js";
import { runValueScan } from "../src/engine/valueScan.js";
import { runSlipBuilder } from "../src/engine/slipBuilder.js";

describe("priceMatch", () => {
  it("prices a known fixture with high confidence and normalized probs", () => {
    const m = priceMatch("Argentina", "France");
    expect(m.confidence).toBe("high");
    expect(m.probs.home + m.probs.draw + m.probs.away).toBeCloseTo(1, 6);
    expect(m.fairOdds.home).toBeGreaterThan(1);
  });

  it("rates the stronger side as favourite (Brazil over Qatar)", () => {
    const m = priceMatch("Brazil", "Qatar");
    expect(m.probs.home).toBeGreaterThan(m.probs.away);
  });

  it("falls back to a neutral prior for unknown teams (low confidence)", () => {
    const m = priceMatch("Atlantis", "Wakanda");
    expect(m.confidence).toBe("low");
    expect(m.probs.home + m.probs.draw + m.probs.away).toBeCloseTo(1, 6);
  });
});

describe("runValueScan (caller-supplied odds, no network)", () => {
  it("computes an edge from explicit decimal odds", async () => {
    const r = await runValueScan({
      home: "Argentina",
      away: "France",
      neutral: true,
      market: { decimalOdds: { home: 2.5, draw: 3.3, away: 3.1 } },
      kellyCap: 0.25,
    } as any);
    expect(r.market.source).toBe("caller-odds");
    expect(r.legs.length).toBe(3);
    expect(typeof r.best?.edgePct).toBe("number");
  });
});

describe("runSlipBuilder", () => {
  it("keeps only legs above the edge threshold", async () => {
    const r = await runSlipBuilder({
      matches: [
        { home: "Brazil", away: "Qatar", neutral: true, market: { decimalOdds: { home: 1.9, draw: 4.0, away: 6.0 } } },
        { home: "France", away: "Argentina", neutral: true, market: { decimalOdds: { home: 2.6, draw: 3.3, away: 2.9 } } },
      ],
      minEdgePct: 3,
      maxLegs: 4,
    } as any);
    expect(r.considered).toBe(2);
    for (const leg of r.legs) expect(leg.edgePct).toBeGreaterThanOrEqual(3);
  });
});

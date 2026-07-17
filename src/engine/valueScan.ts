// value_scan: price a match, pull/accept a market, and quantify the edge.
import type { Outcome, ValueLeg, ValueScanInputT } from "../types.js";
import { priceMatch } from "./pricing.js";
import { scoreValue } from "../model/value.js";
import { searchPolymarket, type PolyMarket } from "../data/polymarket.js";
import { resolveTeam } from "../data/teams.js";

export interface ValueScanResult {
  match: ReturnType<typeof priceMatch>;
  market: {
    source: "caller-odds" | "caller-prices" | "polymarket" | "unavailable";
    reference?: string;
    url?: string;
    decimalOdds: Partial<Record<Outcome, number>>;
    unmapped?: { name: string; price: number }[];
  };
  legs: ValueLeg[];
  best?: ValueLeg;
  note?: string;
}

/** Try to map Polymarket outcome labels onto home/draw/away for this fixture. */
function mapPolymarket(pm: PolyMarket, home: string, away: string): {
  decimalOdds: Partial<Record<Outcome, number>>;
  unmapped: { name: string; price: number }[];
} {
  const h = resolveTeam(home).displayName.toLowerCase();
  const a = resolveTeam(away).displayName.toLowerCase();
  const decimalOdds: Partial<Record<Outcome, number>> = {};
  const unmapped: { name: string; price: number }[] = [];
  for (const o of pm.outcomes) {
    const label = o.name.toLowerCase();
    const dec = o.price > 0 ? 1 / o.price : undefined;
    if (!dec) continue;
    if (/\b(draw|tie)\b/.test(label)) decimalOdds.draw = dec;
    else if (label.includes(h) || h.includes(label)) decimalOdds.home = dec;
    else if (label.includes(a) || a.includes(label)) decimalOdds.away = dec;
    else unmapped.push({ name: o.name, price: o.price });
  }
  return { decimalOdds, unmapped };
}

export async function runValueScan(input: ValueScanInputT): Promise<ValueScanResult> {
  const match = priceMatch(input.home, input.away, input.neutral);

  let source: ValueScanResult["market"]["source"] = "unavailable";
  let decimalOdds: Partial<Record<Outcome, number>> = {};
  let reference: string | undefined;
  let url: string | undefined;
  let unmapped: { name: string; price: number }[] | undefined;
  let note: string | undefined;

  const m = input.market;
  if (m.decimalOdds) {
    source = "caller-odds";
    decimalOdds = m.decimalOdds;
  } else if (m.prices) {
    source = "caller-prices";
    decimalOdds = Object.fromEntries(
      Object.entries(m.prices).map(([k, v]) => [k, 1 / (v as number)]),
    ) as Partial<Record<Outcome, number>>;
  } else if (m.polymarket) {
    const results = await searchPolymarket(m.polymarket, 5);
    const pm = results[0];
    if (pm) {
      source = "polymarket";
      reference = pm.question;
      url = pm.url;
      const mapped = mapPolymarket(pm, input.home, input.away);
      decimalOdds = mapped.decimalOdds;
      unmapped = mapped.unmapped.length ? mapped.unmapped : undefined;
      if (Object.keys(decimalOdds).length === 0) {
        note = "Found a Polymarket market but could not map its outcomes to this fixture; pass explicit decimalOdds instead.";
      }
    } else {
      note = "No live Polymarket market matched that query; pass explicit decimalOdds or prices.";
    }
  }

  const legs = Object.keys(decimalOdds).length ? scoreValue(match.probs, decimalOdds, input.kellyCap) : [];
  return {
    match,
    market: { source, reference, url, decimalOdds, unmapped },
    legs,
    best: legs[0],
    note,
  };
}

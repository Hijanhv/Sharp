// Single source of truth for Sharp's three services. Both the REST routes and
// the MCP endpoint are generated from this registry, so pricing, schemas, and
// behaviour can never drift between the two surfaces.
import { z } from "zod";
import { FairOddsInput, ValueScanInput, SlipBuilderInput } from "../types.js";
import { priceMatch } from "../engine/pricing.js";
import { runValueScan } from "../engine/valueScan.js";
import { runSlipBuilder } from "../engine/slipBuilder.js";

export type ToolKind = "fair_odds" | "value_scan" | "slip_builder";

export interface ToolDef {
  name: ToolKind;
  title: string;
  description: string;
  priceUsd: number; // price per call in USDT (USD-pegged)
  path: string; // REST path
  schema: z.ZodTypeAny;
  /** Pure-ish handler: validated input -> domain result object. */
  handler: (input: unknown) => Promise<unknown>;
}

export const TOOLS: Record<ToolKind, ToolDef> = {
  fair_odds: {
    name: "fair_odds",
    title: "Fair Odds",
    description:
      "Calibrated win/draw/win probabilities and fair decimal odds for a football match, with the top-3 most likely scorelines. Dixon-Coles model; probabilities always sum to 100%. Input: { home, away, neutral? }.",
    priceUsd: 0.02,
    path: "/fair-odds",
    schema: FairOddsInput,
    handler: async (input) => {
      const i = FairOddsInput.parse(input);
      return priceMatch(i.home, i.away, i.neutral);
    },
  },
  value_scan: {
    name: "value_scan",
    title: "Value Scan",
    description:
      "Compares Sharp's fair odds against a live market (Polymarket query, or caller-supplied decimal odds/prices) and returns the edge %, expected value, Kelly stake and a verdict for each outcome. Input: { home, away, neutral?, market:{ polymarket|decimalOdds|prices }, kellyCap? }.",
    priceUsd: 0.1,
    path: "/value-scan",
    schema: ValueScanInput,
    handler: async (input) => {
      const i = ValueScanInput.parse(input);
      return runValueScan(i);
    },
  },
  slip_builder: {
    name: "slip_builder",
    title: "Slip Builder",
    description:
      "Scans several fixtures, keeps only legs above an edge threshold, and assembles the best value parlay with an honest combined edge. Input: { matches:[{home,away,market}], minEdgePct?, maxLegs? }.",
    priceUsd: 0.25,
    path: "/slip",
    schema: SlipBuilderInput,
    handler: async (input) => {
      const i = SlipBuilderInput.parse(input);
      return runSlipBuilder(i);
    },
  },
};

export const TOOL_LIST: ToolDef[] = Object.values(TOOLS);

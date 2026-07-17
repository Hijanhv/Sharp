// Match-pricing engine: turns two team names into a fully calibrated MatchPricing.
import type { MatchPricing } from "../types.js";
import { resolveTeam } from "../data/teams.js";
import {
  buildScoreMatrix,
  outcomeProbs,
  topScores,
  bttsProb,
  over25Prob,
} from "../model/dixonColes.js";

// Average goals scored per team in an international fixture (model base rate).
const BASE_GOALS = 1.35;
// Home scoring multiplier for non-neutral venues. World Cup knockouts are neutral.
const HOME_ADVANTAGE = 1.25;
const LAMBDA_MIN = 0.15;
const LAMBDA_MAX = 5;

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

const round = (x: number, n = 4): number => {
  const f = 10 ** n;
  return Math.round(x * f) / f;
};

// Round the three outcome probabilities so they sum to EXACTLY 1 at the given
// precision — the residual from independent rounding is folded into the largest
// bucket. This is why Sharp's displayed home/draw/away always add to 100%.
function roundProbs(probs: { home: number; draw: number; away: number }, n = 4): { home: number; draw: number; away: number } {
  const f = 10 ** n;
  let h = Math.round(probs.home * f);
  let d = Math.round(probs.draw * f);
  let a = Math.round(probs.away * f);
  const diff = f - (h + d + a);
  if (diff !== 0) {
    if (h >= d && h >= a) h += diff;
    else if (d >= h && d >= a) d += diff;
    else a += diff;
  }
  return { home: h / f, draw: d / f, away: a / f };
}

export function priceMatch(homeName: string, awayName: string, neutral = true): MatchPricing {
  const home = resolveTeam(homeName);
  const away = resolveTeam(awayName);

  const homeFactor = neutral ? 1 : HOME_ADVANTAGE;
  const lambda = clamp(BASE_GOALS * home.rating.att * away.rating.def * homeFactor, LAMBDA_MIN, LAMBDA_MAX);
  const mu = clamp(BASE_GOALS * away.rating.att * home.rating.def, LAMBDA_MIN, LAMBDA_MAX);

  const sm = buildScoreMatrix(lambda, mu);
  const probs = outcomeProbs(sm);

  const confidence: MatchPricing["confidence"] =
    home.matched && away.matched ? "high" : home.matched || away.matched ? "medium" : "low";

  return {
    home: home.displayName,
    away: away.displayName,
    neutral,
    lambda: { home: round(lambda), away: round(mu) },
    probs: roundProbs(probs),
    fairOdds: {
      home: round(1 / probs.home, 3),
      draw: round(1 / probs.draw, 3),
      away: round(1 / probs.away, 3),
    },
    topScores: topScores(sm, 3).map((s) => ({ home: s.home, away: s.away, prob: round(s.prob) })),
    expectedGoals: round(lambda + mu, 2),
    bttsProb: round(bttsProb(sm)),
    over25Prob: round(over25Prob(sm)),
    confidence,
    method: "Dixon-Coles bivariate Poisson (rho=-0.06), probabilities renormalized to 1.0",
  };
}

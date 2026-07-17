// Dixon-Coles bivariate Poisson model for football match outcomes.
//
// Reference: Dixon & Coles (1997), "Modelling Association Football Scores and
// Inefficiencies in the Football Betting Market". We build a score matrix from
// two Poisson intensities (home/away expected goals), apply the low-score
// dependence correction (tau), then RENORMALIZE the full matrix so outcome
// probabilities sum to exactly 1. That final renormalization is the whole point:
// it is why Sharp's home/draw/away always add to 100% — the calibration flaw
// reviewers flagged on the incumbent (probabilities summing to 125%).

import type { OutcomeProbs, ScoreLine } from "../types.js";

const MAX_GOALS = 10;

/** Poisson probability mass P(X = k | lambda). */
export function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  // exp(k*ln(lambda) - lambda - ln(k!)) for numerical stability
  return Math.exp(k * Math.log(lambda) - lambda - logFactorial(k));
}

const LOG_FACT_CACHE: number[] = [0, 0];
function logFactorial(n: number): number {
  if (n < LOG_FACT_CACHE.length) return LOG_FACT_CACHE[n]!;
  let value = LOG_FACT_CACHE[LOG_FACT_CACHE.length - 1]!;
  for (let i = LOG_FACT_CACHE.length; i <= n; i++) {
    value += Math.log(i);
    LOG_FACT_CACHE[i] = value;
  }
  return LOG_FACT_CACHE[n]!;
}

/**
 * Dixon-Coles low-score dependence correction.
 * rho < 0 lifts the probability of 0-0 and 1-1 draws (empirically observed);
 * we use a mild default. Only the four lowest scorelines are adjusted.
 */
export function tau(homeGoals: number, awayGoals: number, lambda: number, mu: number, rho: number): number {
  if (homeGoals === 0 && awayGoals === 0) return 1 - lambda * mu * rho;
  if (homeGoals === 0 && awayGoals === 1) return 1 + lambda * rho;
  if (homeGoals === 1 && awayGoals === 0) return 1 + mu * rho;
  if (homeGoals === 1 && awayGoals === 1) return 1 - rho;
  return 1;
}

export interface ScoreMatrix {
  matrix: number[][]; // [home][away], normalized to sum 1
  lambda: number;
  mu: number;
}

/** Build the normalized score-probability matrix. */
export function buildScoreMatrix(lambda: number, mu: number, rho = -0.06): ScoreMatrix {
  const matrix: number[][] = [];
  let total = 0;
  for (let h = 0; h <= MAX_GOALS; h++) {
    const row: number[] = [];
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = Math.max(0, tau(h, a, lambda, mu, rho) * poissonPmf(h, lambda) * poissonPmf(a, mu));
      row.push(p);
      total += p;
    }
    matrix.push(row);
  }
  // Renormalize — guarantees every derived distribution sums to exactly 1.
  if (total > 0) {
    for (let h = 0; h <= MAX_GOALS; h++) {
      for (let a = 0; a <= MAX_GOALS; a++) {
        matrix[h]![a]! /= total;
      }
    }
  }
  return { matrix, lambda, mu };
}

/** Home/draw/away probabilities from a score matrix. Guaranteed to sum to 1. */
export function outcomeProbs(sm: ScoreMatrix): OutcomeProbs {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let h = 0; h < sm.matrix.length; h++) {
    for (let a = 0; a < sm.matrix[h]!.length; a++) {
      const p = sm.matrix[h]![a]!;
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
    }
  }
  // Defensive re-normalization against floating-point drift.
  const s = home + draw + away || 1;
  return { home: home / s, draw: draw / s, away: away / s };
}

/** Top-N most likely exact scorelines. */
export function topScores(sm: ScoreMatrix, n = 3): ScoreLine[] {
  const lines: ScoreLine[] = [];
  for (let h = 0; h < sm.matrix.length; h++) {
    for (let a = 0; a < sm.matrix[h]!.length; a++) {
      lines.push({ home: h, away: a, prob: sm.matrix[h]![a]! });
    }
  }
  lines.sort((x, y) => y.prob - x.prob);
  return lines.slice(0, n);
}

/** P(both teams score). */
export function bttsProb(sm: ScoreMatrix): number {
  let p = 0;
  for (let h = 1; h < sm.matrix.length; h++) {
    for (let a = 1; a < sm.matrix[h]!.length; a++) p += sm.matrix[h]![a]!;
  }
  return p;
}

/** P(total goals > 2.5). */
export function over25Prob(sm: ScoreMatrix): number {
  let p = 0;
  for (let h = 0; h < sm.matrix.length; h++) {
    for (let a = 0; a < sm.matrix[h]!.length; a++) {
      if (h + a >= 3) p += sm.matrix[h]![a]!;
    }
  }
  return p;
}

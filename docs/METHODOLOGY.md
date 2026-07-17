# Methodology

Sharp turns two team names (or a market) into calibrated probabilities, fair odds, and a value edge. Every number is a **pure, deterministic function** — the LLM in an agent client may *narrate* Sharp's output, but it never invents a probability.

## 1. Expected goals from ratings
Each team carries a multiplicative **attack** (`att`, league avg = 1.0) and **defense** (`def`, lower = concedes fewer) prior. Expected goals for a fixture:

```
λ_home = BASE · att_home · def_away · homeFactor
λ_away = BASE · att_away · def_home
```

`BASE = 1.35` (avg international goals/team). `homeFactor = 1.0` for neutral venues (World Cup knockouts) and `1.25` when a true home side is set. λ is clamped to `[0.15, 5]`.

The ratings ship in-repo (`src/data/teams.ts`) as a transparent prior so Sharp answers instantly with no API key. They are designed to be **recalibrated** from live xG feeds (understat / football-data.org / api-football) — swap the dataset and the whole engine updates.

## 2. Dixon-Coles bivariate Poisson
From `λ_home, λ_away` we build a score matrix `P(i,j)` up to 10 goals per side using independent Poisson masses, then apply the **Dixon-Coles low-score dependence correction** `τ(i,j; ρ)` (ρ = −0.06) which lifts 0-0 / 1-1 draws, an empirically observed inefficiency in the independent-Poisson model.

> Reference: M. Dixon & S. Coles (1997), *Modelling Association Football Scores and Inefficiencies in the Football Betting Market*, Applied Statistics 46(2).

## 3. Normalization — the 100% guarantee
The corrected matrix is **renormalized to sum to 1**, and outcome (home/draw/away) probabilities are summed from it and **renormalized again** against floating-point drift. The displayed probabilities are then rounded so the three buckets **sum to exactly 100%**.

This directly fixes the top complaint on the incumbent World Cup ASP, whose win/draw/win probabilities were reviewed as summing to **125%**. A model that can't keep a probability distribution normalized can't be trusted to price anything.

## 4. Value: de-vig + edge + Kelly
Given market decimal odds (from Polymarket or supplied by the caller):
1. **Implied price** of an outcome = `1 / decimalOdds` (this is what you pay).
2. **De-vig** all implied prices proportionally so they sum to 1 → fair market probability.
3. **Edge %** = `modelProb / marketPrice − 1` — how much more likely Sharp thinks the outcome is than the price implies.
4. **Expected value** per unit = `modelProb · decimalOdds − 1`.
5. **Kelly fraction** = `(b·p − q) / b`, `b = decimalOdds − 1`, clamped to 0 (no edge → no bet) and capped by `kellyCap` (default 0.25 = quarter-Kelly, the sane default).

Verdicts: `strong-value` (≥8% edge), `value` (≥3%), `fair` (>−3%), `no-value` otherwise.

## 5. Honesty rails
- Probabilities always sum to 100%; parlay edges assume leg independence and say so.
- Unknown teams get a neutral prior and a `low` confidence flag rather than a fake-confident answer.
- Output is labelled model research, not financial advice.

# Methodology

Sharp turns two team names, or a match plus a market, into calibrated probabilities, fair odds, a value edge, a Kelly stake, and a hedge plan. Every number is a pure, deterministic function. An agent that calls Sharp may describe the output, but it never invents a probability.

## 1. Expected goals from ratings

Each team has a multiplicative attack rating (`att`, league average 1.0) and defense rating (`def`, lower means it concedes fewer). Expected goals for a fixture:

```
lambda_home = BASE * att_home * def_away * homeFactor
lambda_away = BASE * att_away * def_home
```

`BASE` is 1.35, the average international goals per team. `homeFactor` is 1.0 for neutral venues such as World Cup knockouts and 1.25 when a real home side is set. Lambda is clamped to the range 0.15 to 5. The ratings ship in the repo as a transparent prior so Sharp answers with no external key, and they are designed to be recalibrated from live expected-goals data.

## 2. Dixon-Coles bivariate Poisson

From the two lambdas, Sharp builds a score matrix up to ten goals per side using Poisson masses, then applies the Dixon-Coles correction for the dependence between low scores (rho = -0.06), which lifts 0-0 and 1-1 draws. This is a documented inefficiency in the plain independent-Poisson model.

Reference: M. Dixon and S. Coles (1997), Modelling Association Football Scores and Inefficiencies in the Football Betting Market, Applied Statistics 46(2).

## 3. Normalization, the 100 percent guarantee

The corrected matrix is renormalized to sum to 1, the outcome probabilities are summed from it, and they are renormalized again against floating-point drift. The displayed probabilities are rounded so the three buckets sum to exactly 100 percent. This is the fix for the incumbent whose probabilities were reviewed as summing to 125 percent.

## 4. Value: de-vig and edge

Given market decimal odds:

1. The implied price of an outcome is `1 / decimalOdds`. That is what you pay.
2. All implied prices are de-vigged proportionally so they sum to 1, giving the market's fair probability.
3. The edge is `modelProb / marketPrice - 1`, how much more likely Sharp thinks the outcome is than the price implies.
4. Expected value per unit staked is `modelProb * decimalOdds - 1`.

## 5. Position sizing: fractional Kelly

Stakes use the Kelly criterion `f = (b*p - q) / b`, with `b = decimalOdds - 1`, `p` the model probability, and `q = 1 - p`. Kelly maximizes long-run growth. Sharp clamps any no-edge bet to zero and caps the fraction at quarter Kelly by default, which keeps sizing disciplined and bounds drawdowns.

## 6. Hedging and arbitrage

Given the decimal odds across every outcome, Sharp computes the equal-payout split. Stake each outcome in proportion to `1 / odds`. Let `k` be the sum of `1 / odds` across the outcomes. Every outcome then pays the same amount, and the locked return on total stake is `1/k - 1`.

- If `k` is below 1, the book is underround and this is a genuine arbitrage with a guaranteed profit.
- If `k` is above 1, the number is negative and tells you the cost of removing all variance.

For a parlay, the combined edge multiplies the leg probabilities and the leg odds. That assumes the legs are independent, and Sharp states this, because correlated legs (same match or tournament) inflate the number and should be sized down.

## 7. Honesty rails

- Probabilities always sum to 100 percent.
- Unknown teams get a neutral prior and a low confidence flag, not a confident answer.
- Output is labelled model research, not financial advice.

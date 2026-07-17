# Sharp — OKX.AI Genesis Submission Kit

Everything needed to list, post, and submit. Fill the `<…>` placeholders once deployed.

## Positioning
- **Primary track:** Finance Copilot (3 winners × $2,500) — Finance category on the marketplace.
- **Also eligible from one build:** Revenue Rocket (x402 pay-per-call), Best Product (polish + longevity), Social Buzz (topical, shareable cards).
- **Core claim:** *We don't guess scores — we price the market, and our probabilities always sum to 100%.* Fixes the incumbent's documented 125%-probability flaw with a real Dixon-Coles model + a live value edge.

## ASP registration fields (A2MCP)
| Field | Value |
| --- | --- |
| Name | Sharp |
| Category | Finance |
| Description | Calibrated fair odds + live market value edge for football & prediction markets. Dixon-Coles model, probabilities that sum to 100%, Kelly staking. |
| Service type | A2MCP |
| Network | X Layer (eip155:196) |
| Settlement asset | USD₮0 (`0x779ded0c9e1022225f8e0630b35a9b54be713736`) |
| MCP endpoint | `<PUBLIC_BASE_URL>/mcp` |

### Services
| Service | Endpoint | Price |
| --- | --- | --- |
| `fair_odds` — calibrated W/D/W probabilities, fair decimal odds, top-3 scores | `POST <PUBLIC_BASE_URL>/fair-odds` | 0.02 USDT |
| `value_scan` — model vs market → edge %, EV, Kelly, verdict | `POST <PUBLIC_BASE_URL>/value-scan` | 0.10 USDT |
| `slip_builder` — best value legs across a slate + combined edge | `POST <PUBLIC_BASE_URL>/slip` | 0.25 USDT |

## Go-live checklist
1. `npx skills add okx/onchainos-skills --yes -g` in your agent → log into Agentic Wallet with your email.
2. Deploy to a public HTTPS URL (Railway/Render/Fly/VPS). Set `PUBLIC_BASE_URL`.
3. `PAYMENT_MODE=off` first → register + list → **go live immediately** (starts the 24h review clock). Then set `PAYMENT_MODE=x402` + your `PAYMENT_PAY_TO` (X Layer wallet) to earn.
4. Self-check: `curl -i -X POST <PUBLIC_BASE_URL>/fair-odds` → `200`+result (free) or `402`+`PAYMENT-REQUIRED` (x402). Or run `npm run selfcheck`.
5. Confirm listing shows **live** before submitting the form.

## Submission fields (Google form)
- **Project name:** Sharp
- **One-line pitch:** Calibrated fair odds + live market edge for prediction markets — probabilities that actually sum to 100%.
- **Category:** Finance
- **ASP link:** `<OKX_ASP_URL>`
- **X post link:** `<X_POST_URL>`
- **GitHub:** https://github.com/Hijanhv/Sharp
- **Demo:** embedded in the X post (≤90s)

## X post (#OKXAI)
```
Meet Sharp 🎯 — the fair-odds & value agent on @OKX AI.

Most football AIs guess scores (and their probabilities sum to 125% 🙃).
Sharp PRICES the market:
📊 calibrated W/D/W odds — always 100%
💹 live edge % vs Polymarket
🎰 Kelly stake + shareable card

Pay-per-call via x402 on X Layer.
#OKXAI  <ASP link>
```
(Attach the ≤90s screen recording below.)

## 90-second demo script
- **0–10s** — Landing page: "Sharp prices prediction markets. We don't guess scores — we price them, and our probabilities always add to 100%."
- **10–30s** — `fair_odds` on the World Cup final: show W/D/W, fair odds, top-3 scores, and the **sum = 100% ✓** line (call out the incumbent's 125% bug).
- **30–55s** — `value_scan` vs the live Polymarket price: highlight **+edge%**, EV, and the **Kelly** stake with the verdict chip.
- **55–75s** — Open the shareable `/r/:id` card; mention it's callable over **MCP** and settles **pay-per-call via x402 on X Layer**.
- **75–90s** — "Sharp — calibrated edge for the agent economy, live on OKX.AI. #OKXAI."

## Links
- GitHub: https://github.com/Hijanhv/Sharp
- Live demo: `<PUBLIC_BASE_URL>`
- MCP endpoint: `<PUBLIC_BASE_URL>/mcp`
- OKX.AI ASP: `<OKX_ASP_URL>`
- X participation post: `<X_POST_URL>`

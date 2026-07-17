# Sharp — the fair-odds & value-edge agent for OKX.AI

> **We don't guess scores. We price the market — and our probabilities actually add up to 100%.**

**Sharp** is an [OKX.AI](https://www.okx.ai) **Agent Service Provider (A2MCP)** in the **Finance** category. Give it a football match (or any prediction market) and it returns **calibrated fair odds**, the **live market price**, the **value edge %**, and a **Kelly stake** — with a shareable report card. It's built for the [OKX.AI Genesis Hackathon](https://www.hackquest.io/hackathons/OKXAI-Genesis-Hackathon).

The engine is a proper **Dixon-Coles bivariate Poisson** model (the standard in football betting research), with strict probability **normalization to 100%** — directly fixing the top complaint reviewers left on the current market leader, whose win/draw/win probabilities sum to *125%*. Odds and edge are **pure deterministic functions**; an LLM is never allowed to invent a number.

## Why it wins
- **Finance Copilot track** (3 winners) + eligible for Revenue Rocket / Best Product / Social Buzz from one build.
- **Proven demand:** the incumbent World Cup ASP has 174 sales and 76 reviews — Sharp targets the same demand with a *calibrated* model and a real edge number.
- **Rides the featured 🔥 World Cup lane** through the July 19 final, but the engine prices **any Polymarket market**, so it survives the tournament.
- **OKX-native:** MCP + x402 pay-per-call on **X Layer**, discoverable and callable by other agents.

## Services (A2MCP tools)
| Tool | Endpoint | Price | Returns |
| --- | --- | --- | --- |
| `fair_odds` | `POST /fair-odds` | 0.02 USDT | normalized P(home/draw/away) + fair decimal odds + top-3 correct scores |
| `value_scan` | `POST /value-scan` | 0.10 USDT | model vs live market → **edge %**, expected value, Kelly stake, verdict |
| `slip_builder` | `POST /slip` | 0.25 USDT | best value legs across today's slate + combined edge + shareable card URL |

All three are also exposed over MCP at `POST /mcp` (JSON-RPC 2.0) and rendered as a shareable card at `GET /r/:id`.

## Quick start
```bash
npm install
cp .env.example .env      # PAYMENT_MODE=off ships free + live-ready
npm test                  # deterministic model tests
npm start                 # serves on http://localhost:8787
```

Try it:
```bash
curl -s -X POST localhost:8787/fair-odds \
  -H 'content-type: application/json' \
  -d '{"home":"Argentina","away":"France"}' | jq
```

## Going live on OKX.AI (A2MCP)
1. In your agent (Claude Code / OpenClaw), install OKX skills: `npx skills add okx/onchainos-skills --yes -g`, then log into your **Agentic Wallet** with your email.
2. Deploy Sharp to a public HTTPS URL, set `PUBLIC_BASE_URL`.
3. Register each service and list the ASP (`Help me register an A2MCP ASP on OKX.AI …`). Free mode goes live immediately; flip `PAYMENT_MODE=x402` with your `PAYMENT_PAY_TO` to earn.
4. Self-check: `curl -i -X POST <url>/fair-odds` → `200` (free) or `402` + `PAYMENT-REQUIRED` (x402).

See [`docs/okx-submission-kit.md`](docs/okx-submission-kit.md) for the listing fields, #OKXAI post, and 90-second demo script.

## How the model works
See [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md). In short: team attack/defense ratings → Dixon-Coles adjusted score matrix → outcome probabilities (renormalized) → fair odds → compared against de-vigged market prices for the edge and Kelly fraction. Transparent, reproducible, and calibratable.

MIT © Hijanhv

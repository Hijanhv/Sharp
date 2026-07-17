// Endpoint self-check — mirrors OKX's ASP review test. Boots the server on an
// ephemeral port and asserts the compliant response shape for the current
// PAYMENT_MODE (200 + result when free, 402 + PAYMENT-REQUIRED when x402).
import { loadConfig } from "../src/config.js";
import { buildServer } from "../src/server/http.js";

async function main(): Promise<void> {
  const cfg = loadConfig();
  const app = buildServer(cfg);
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address();
  const port = typeof addr === "object" && addr ? addr.port : cfg.port;
  const base = `http://127.0.0.1:${port}`;
  let failures = 0;

  const check = (name: string, cond: boolean, detail = "") => {
    console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
    if (!cond) failures++;
  };

  // fair_odds
  const r1 = await fetch(`${base}/fair-odds`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ home: "Argentina", away: "France" }),
  });
  if (cfg.payment.mode === "off") {
    const j: any = await r1.json();
    check("POST /fair-odds returns 200 (free mode)", r1.status === 200, `status ${r1.status}`);
    check("probabilities sum to 1.0", Math.abs(j.probs.home + j.probs.draw + j.probs.away - 1) < 1e-6);
    check("returns a shareable reportUrl", typeof j.reportUrl === "string");
  } else {
    check("POST /fair-odds returns 402 (x402 mode)", r1.status === 402, `status ${r1.status}`);
    check("carries PAYMENT-REQUIRED header", !!r1.headers.get("payment-required"));
  }

  // health + services
  const h = await fetch(`${base}/health`);
  check("GET /health ok", h.status === 200);
  const s = await fetch(`${base}/services`);
  check("GET /services ok", s.status === 200);

  // MCP tools/list (always free)
  const m = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  const mj: any = await m.json();
  check("MCP tools/list returns 3 tools", Array.isArray(mj.result?.tools) && mj.result.tools.length === 3);

  // Stateless card with a long payload (value_scan) must not 414 (maxParamLength).
  const cardPayload = Buffer.from(
    JSON.stringify({ k: "value_scan", i: { home: "Argentina", away: "France", market: { decimalOdds: { home: 2.6, draw: 3.3, away: 3.0 } } } }),
    "utf8",
  ).toString("base64url");
  const card = await fetch(`${base}/c/${cardPayload}`);
  check("long value_scan card renders (no 414)", card.status === 200, `status ${card.status}`);

  await app.close();
  console.log(failures === 0 ? "\nAll self-checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();

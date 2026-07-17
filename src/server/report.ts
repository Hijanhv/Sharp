// In-memory report store + HTML renderer. Each priced result gets a short id and
// a shareable /r/:id card — the demo surface and the Social-Buzz screenshot engine.
import type { ToolKind } from "./tools.js";

interface ReportEntry {
  kind: ToolKind;
  data: any;
  createdAt: number;
}

const STORE = new Map<string, ReportEntry>();
const MAX = 500;

function shortId(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
}

export function saveReport(kind: ToolKind, data: unknown): string {
  const id = shortId();
  STORE.set(id, { kind, data, createdAt: Date.now() });
  if (STORE.size > MAX) {
    const oldest = [...STORE.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    if (oldest) STORE.delete(oldest[0]);
  }
  return id;
}

export function getReport(id: string): ReportEntry | undefined {
  return STORE.get(id);
}

const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const odds = (x: number): string => x.toFixed(2);

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Sharp</title>
<style>
:root{--bg:#0b0e14;--card:#141924;--fg:#e6edf3;--mut:#8b98a9;--line:#232a37;--acc:#3fb950;--warn:#e3b341;--bad:#f85149;--chip:#1b2230}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:640px;margin:0 auto;padding:28px 18px}
.brand{display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.3px;margin-bottom:18px}
.brand .dot{width:10px;height:10px;border-radius:50%;background:var(--acc);box-shadow:0 0 12px var(--acc)}
.brand small{color:var(--mut);font-weight:500}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;margin-bottom:16px}
h1{font-size:20px;margin:0 0 4px}.sub{color:var(--mut);font-size:13px;margin:0 0 16px}
.row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
.row:last-child{border-bottom:0}
.k{color:var(--mut)}.v{font-variant-numeric:tabular-nums;font-weight:600}
.bar{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:6px 0 14px;border:1px solid var(--line)}
.bar>span{display:block}.bar .h{background:#3b82f6}.bar .d{background:#6b7280}.bar .a{background:#ef4444}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:8px 0 4px}
.tile{background:var(--chip);border:1px solid var(--line);border-radius:12px;padding:12px;text-align:center}
.tile .lab{color:var(--mut);font-size:12px}.tile .num{font-size:18px;font-weight:700;font-variant-numeric:tabular-nums}
.chip{display:inline-block;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:600}
.strong-value{background:rgba(63,185,80,.15);color:var(--acc)}.value{background:rgba(63,185,80,.12);color:var(--acc)}
.fair{background:rgba(139,152,169,.15);color:var(--mut)}.no-value{background:rgba(248,81,73,.14);color:var(--bad)}
.foot{color:var(--mut);font-size:12px;text-align:center;margin-top:6px}
a{color:#58a6ff}
</style></head><body><div class="wrap">
<div class="brand"><span class="dot"></span>SHARP <small>· fair odds &amp; value edge · OKX.AI</small></div>
${body}
<p class="foot">Model output for research. Not financial advice. · Powered by Sharp on OKX.AI</p>
</div></body></html>`;
}

function renderFairOdds(m: any): string {
  const p = m.probs;
  const scores = m.topScores.map((s: any) => `${s.home}–${s.away} <span class="k">(${pct(s.prob)})</span>`).join(" · ");
  return shell(`${m.home} vs ${m.away}`, `
<div class="card">
  <h1>${esc(m.home)} vs ${esc(m.away)}</h1>
  <p class="sub">${m.neutral ? "Neutral venue" : "Home advantage applied"} · confidence: ${m.confidence} · xG ${m.lambda.home}–${m.lambda.away}</p>
  <div class="bar"><span class="h" style="width:${p.home * 100}%"></span><span class="d" style="width:${p.draw * 100}%"></span><span class="a" style="width:${p.away * 100}%"></span></div>
  <div class="grid">
    <div class="tile"><div class="lab">${esc(m.home)}</div><div class="num">${pct(p.home)}</div><div class="k">${odds(m.fairOdds.home)}</div></div>
    <div class="tile"><div class="lab">Draw</div><div class="num">${pct(p.draw)}</div><div class="k">${odds(m.fairOdds.draw)}</div></div>
    <div class="tile"><div class="lab">${esc(m.away)}</div><div class="num">${pct(p.away)}</div><div class="k">${odds(m.fairOdds.away)}</div></div>
  </div>
  <div class="row"><span class="k">Most likely scores</span><span class="v">${scores}</span></div>
  <div class="row"><span class="k">Both teams to score</span><span class="v">${pct(m.bttsProb)}</span></div>
  <div class="row"><span class="k">Over 2.5 goals</span><span class="v">${pct(m.over25Prob)}</span></div>
  <div class="row"><span class="k">Sum check</span><span class="v" style="color:var(--acc)">${pct(p.home + p.draw + p.away)} ✓</span></div>
</div>`);
}

function legRow(l: any): string {
  return `<div class="row"><span class="k">${esc(l.label)} <span class="chip ${l.verdict}">${l.verdict.replace("-", " ")}</span></span>
  <span class="v">${l.edgePct >= 0 ? "+" : ""}${l.edgePct.toFixed(1)}% edge · Kelly ${(l.kellyFraction * 100).toFixed(1)}%</span></div>`;
}

function renderValueScan(r: any): string {
  const m = r.match;
  const best = r.best;
  const legs = r.legs.map(legRow).join("");
  const src = r.market.reference ? `${esc(r.market.source)} · ${esc(r.market.reference)}` : esc(r.market.source);
  const headline = best
    ? `${esc(best.label)}: <span style="color:${best.edgePct >= 3 ? "var(--acc)" : "var(--mut)"}">${best.edgePct >= 0 ? "+" : ""}${best.edgePct.toFixed(1)}% edge</span>`
    : "No market odds mapped";
  return shell(`Value · ${m.home} vs ${m.away}`, `
<div class="card">
  <h1>${esc(m.home)} vs ${esc(m.away)}</h1>
  <p class="sub">Model vs market · ${src}${r.market.url ? ` · <a href="${esc(r.market.url)}">market ↗</a>` : ""}</p>
  <div class="grid">
    <div class="tile"><div class="lab">Model (fair)</div><div class="num">${pct(m.probs.home)}/${pct(m.probs.draw)}/${pct(m.probs.away)}</div></div>
    <div class="tile"><div class="lab">Best edge</div><div class="num">${headline}</div></div>
    <div class="tile"><div class="lab">Confidence</div><div class="num">${m.confidence}</div></div>
  </div>
  ${legs || `<p class="sub">${esc(r.note ?? "Provide decimalOdds or prices to score value.")}</p>`}
</div>`);
}

function renderSlip(r: any): string {
  const legs = r.legs
    .map(
      (l: any) => `<div class="row"><span class="k">${esc(l.home)} v ${esc(l.away)} — ${esc(l.label)}</span>
    <span class="v">${odds(l.decimalOdds)} · +${l.edgePct.toFixed(1)}%</span></div>`,
    )
    .join("");
  const c = r.combined;
  return shell("Value Slip", `
<div class="card">
  <h1>Value Slip</h1>
  <p class="sub">${r.legs.length} leg(s) from ${r.considered} fixture(s) scanned</p>
  ${legs || `<p class="sub">${esc(r.note)}</p>`}
  ${
    c
      ? `<div class="grid" style="margin-top:12px">
    <div class="tile"><div class="lab">Combined odds</div><div class="num">${odds(c.decimalOdds)}</div></div>
    <div class="tile"><div class="lab">Model prob</div><div class="num">${pct(c.modelProb)}</div></div>
    <div class="tile"><div class="lab">Edge</div><div class="num" style="color:var(--acc)">+${c.edgePct.toFixed(1)}%</div></div>
  </div><p class="sub" style="margin-top:12px">${esc(r.note)}</p>`
      : ""
  }
</div>`);
}

export function renderReport(entry: ReportEntry): string {
  if (entry.kind === "fair_odds") return renderFairOdds(entry.data);
  if (entry.kind === "value_scan") return renderValueScan(entry.data);
  return renderSlip(entry.data);
}

// Landing / live-demo page served at GET /. Self-contained (inline CSS+JS) so it
// works anywhere and screenshots cleanly for the #OKXAI post.
import type { AppConfig } from "../config.js";
import type { ToolDef } from "./tools.js";

export function landingPage(cfg: AppConfig, tools: ToolDef[]): string {
  const rows = tools
    .map(
      (t) => `<tr><td><code>${t.name}</code></td><td>${t.title}</td><td class="r">${t.priceUsd} USDT</td><td><code>${t.path}</code></td></tr>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sharp · fair odds &amp; value edge · OKX.AI</title>
<style>
:root{--bg:#0b0e14;--card:#141924;--fg:#e6edf3;--mut:#8b98a9;--line:#232a37;--acc:#3fb950}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:40px 20px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:22px;letter-spacing:.3px}
.brand .dot{width:12px;height:12px;border-radius:50%;background:var(--acc);box-shadow:0 0 14px var(--acc)}
.tag{color:var(--mut);margin:6px 0 26px}
h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin:28px 0 10px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:9px 8px;text-align:left;border-bottom:1px solid var(--line)}
th{color:var(--mut);font-weight:600}.r{text-align:right;font-variant-numeric:tabular-nums}
code{background:#1b2230;padding:2px 6px;border-radius:6px;font-size:13px}
.try{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
input{background:#0d1017;border:1px solid var(--line);color:var(--fg);border-radius:10px;padding:10px 12px;font-size:14px}
button{background:var(--acc);color:#04140a;border:0;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer}
pre{background:#0d1017;border:1px solid var(--line);border-radius:12px;padding:14px;overflow:auto;font-size:13px;max-height:340px}
.badge{display:inline-block;background:rgba(63,185,80,.12);color:var(--acc);border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600}
a{color:#58a6ff}.foot{color:var(--mut);font-size:12px;margin-top:26px}
</style></head><body><div class="wrap">
<div class="brand"><span class="dot"></span>SHARP</div>
<p class="tag">The fair-odds &amp; value-edge agent for OKX.AI. <span class="badge">Finance</span> Mode: <b>${cfg.payment.mode}</b> · X Layer settlement</p>

<div class="card">
<b>We don't guess scores. We price the market</b> — and our probabilities always sum to 100%.
Sharp runs a Dixon-Coles model, compares it to live prediction-market prices, and returns the edge and a Kelly stake.
</div>

<h2>Try it live</h2>
<div class="card">
  <div class="try">
    <input id="home" value="Argentina" placeholder="Home team">
    <input id="away" value="France" placeholder="Away team">
    <button onclick="run()">Get fair odds →</button>
  </div>
  <pre id="out">// result appears here</pre>
</div>

<h2>Services</h2>
<div class="card"><table>
<tr><th>Tool</th><th>Title</th><th class="r">Price</th><th>Endpoint</th></tr>
${rows}
</table>
<p style="color:var(--mut);font-size:13px;margin:12px 0 0">MCP endpoint: <code>POST /mcp</code> · Manifest: <a href="/services">/services</a></p>
</div>

<p class="foot">Model output for research, not financial advice. Built for the OKX.AI Genesis Hackathon · #OKXAI</p>
</div>
<script>
async function run(){
  const out=document.getElementById('out');out.textContent='pricing…';
  try{
    const r=await fetch('/fair-odds',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({home:document.getElementById('home').value,away:document.getElementById('away').value})});
    const j=await r.json();out.textContent=JSON.stringify(j,null,2);
    if(j.reportUrl){out.textContent+='\\n\\n▶ shareable card: '+j.reportUrl;}
  }catch(e){out.textContent='error: '+e}
}
</script>
</body></html>`;
}

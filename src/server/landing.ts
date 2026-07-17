// Landing / live-demo page served at GET /. Self-contained: inline CSS, JS and
// SVG (only web fonts are external). Aesthetic: a precision quant terminal.
// Editorial serif display + monospace data, signal-green accent, staggered
// load reveals, a self-drawing logo, and a live demo whose probability bar
// animates from the model output.
import type { AppConfig } from "../config.js";
import type { ToolDef } from "./tools.js";

// Reusable Sharp mark: a ring (the market) pierced by a rising edge line.
function logoSvg(size = 40, cls = ""): string {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" aria-label="Sharp logo">
  <defs>
    <linearGradient id="sg" x1="8" y1="40" x2="40" y2="8" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2bd576"/><stop offset="1" stop-color="#9df5c4"/>
    </linearGradient>
  </defs>
  <circle class="lg-ring" cx="24" cy="24" r="13" stroke="#2b3947" stroke-width="2.5"/>
  <path class="lg-edge" d="M9 39 L39 9" stroke="url(#sg)" stroke-width="3.2" stroke-linecap="round"/>
  <path class="lg-tip" d="M31 9 H39 V17" stroke="url(#sg)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle class="lg-dot" cx="24" cy="24" r="3.4" fill="#2bd576"/>
</svg>`;
}

function faviconDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="13" fill="none" stroke="#2b3947" stroke-width="2.5"/><path d="M9 39 L39 9" stroke="#2bd576" stroke-width="3.4" stroke-linecap="round"/><path d="M31 9 H39 V17" stroke="#2bd576" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="24" r="3.4" fill="#2bd576"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function landingPage(cfg: AppConfig, tools: ToolDef[]): string {
  const serviceCards = tools
    .map(
      (t, i) => `<div class="svc reveal" style="--d:${0.5 + i * 0.08}s">
      <div class="svc-top"><code>${t.name}</code><span class="price">${t.priceUsd}<small>USDT</small></span></div>
      <div class="svc-title">${t.title}</div>
      <div class="svc-path">POST ${t.path}</div>
    </div>`,
    )
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sharp: fair odds and value edge on OKX.AI</title>
<link rel="icon" href="${faviconDataUri()}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#07090d;--surface:#0f141b;--surface2:#131a22;--ink:#eaf0f5;--mut:#7d8b9a;--line:#1d2530;
  --acc:#2bd576;--acc2:#9df5c4;--bad:#f2555a;--warn:#f5c451;
  --serif:"Fraunces",Georgia,serif;--sans:"Hanken Grotesk",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;z-index:-2;background:
  radial-gradient(60% 45% at 78% 8%,rgba(43,213,118,.14),transparent 60%),
  radial-gradient(50% 40% at 12% 100%,rgba(43,213,118,.07),transparent 60%);}
body::after{content:"";position:fixed;inset:0;z-index:-1;opacity:.035;pointer-events:none;
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:44px 44px;mask-image:radial-gradient(circle at 50% 30%,#000,transparent 85%)}
.wrap{max-width:860px;margin:0 auto;padding:34px 22px 60px}

/* nav */
.nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:60px}
.mark{display:flex;align-items:center;gap:11px}
.mark .word{font-family:var(--serif);font-weight:700;font-size:23px;letter-spacing:.2px}
.pill{font-family:var(--mono);font-size:11px;color:var(--acc);border:1px solid rgba(43,213,118,.3);background:rgba(43,213,118,.07);padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:.1em}

/* hero */
.hero h1{font-family:var(--serif);font-weight:600;font-size:clamp(38px,7vw,64px);line-height:1.02;margin:0 0 18px;letter-spacing:-.02em}
.hero h1 em{font-style:italic;color:var(--acc)}
.hero p{font-size:clamp(16px,2.2vw,19px);color:var(--mut);max-width:52ch;margin:0 0 26px}
.cta{display:flex;gap:12px;flex-wrap:wrap}
.btn{font-family:var(--sans);font-weight:600;font-size:15px;padding:12px 22px;border-radius:12px;border:0;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
.btn.primary{background:linear-gradient(120deg,var(--acc),var(--acc2));color:#052012;box-shadow:0 8px 30px rgba(43,213,118,.28)}
.btn.primary:hover{transform:translateY(-2px);box-shadow:0 12px 38px rgba(43,213,118,.4)}
.btn.ghost{background:var(--surface);color:var(--ink);border:1px solid var(--line)}
.btn.ghost:hover{border-color:var(--acc)}
.btn{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}

h2.sec{font-family:var(--mono);font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:var(--mut);margin:56px 0 16px;display:flex;align-items:center;gap:10px}
h2.sec::before{content:"";width:22px;height:1px;background:var(--acc)}

/* terminal demo */
.term{background:linear-gradient(180deg,var(--surface2),var(--surface));border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.term-bar{display:flex;align-items:center;gap:7px;padding:12px 16px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.015)}
.dot{width:11px;height:11px;border-radius:50%}
.dot.r{background:#ff5f57}.dot.y{background:#febc2e}.dot.g{background:#28c840}
.term-bar span{font-family:var(--mono);font-size:12px;color:var(--mut);margin-left:8px}
.term-body{padding:20px}
.inputs{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.inp{position:relative;flex:1;min-width:130px}
.inp label{position:absolute;top:-8px;left:12px;font-family:var(--mono);font-size:10px;color:var(--mut);background:var(--surface);padding:0 6px;text-transform:uppercase;letter-spacing:.08em}
input{width:100%;background:#0a0e13;border:1px solid var(--line);color:var(--ink);border-radius:11px;padding:13px 14px;font-family:var(--mono);font-size:14px;transition:border-color .16s}
input:focus{outline:none;border-color:var(--acc)}
.vs{font-family:var(--serif);font-style:italic;color:var(--mut)}
/* result */
.res{margin-top:20px;min-height:20px}
.matchline{font-family:var(--serif);font-size:20px;margin:0 0 4px}
.meta{font-family:var(--mono);font-size:12px;color:var(--mut);margin-bottom:14px}
.bar{display:flex;height:38px;border-radius:10px;overflow:hidden;border:1px solid var(--line);background:#0a0e13}
.bar>div{display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;font-weight:600;color:#04140a;width:0;transition:width 1s cubic-bezier(.2,.8,.2,1);white-space:nowrap;overflow:hidden}
.bar .sh{background:linear-gradient(120deg,#2bd576,#7fe8a8)}
.bar .sd{background:#3a4756;color:var(--ink)}
.bar .sa{background:linear-gradient(120deg,#3b82f6,#7cb1ff);color:#04122e}
.odds{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.odds .o{background:#0a0e13;border:1px solid var(--line);border-radius:11px;padding:11px;text-align:center}
.odds .o .l{font-family:var(--mono);font-size:11px;color:var(--mut)}
.odds .o .n{font-family:var(--mono);font-size:19px;font-weight:600}
.sumtag{font-family:var(--mono);font-size:11px;color:var(--acc);margin-top:12px}
.hint{font-family:var(--mono);font-size:12px;color:var(--mut)}

/* how it works */
.flow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.node{font-family:var(--mono);font-size:12.5px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:9px 13px}
.node.hot{border-color:rgba(43,213,118,.4);color:var(--acc)}
.arw{color:var(--mut)}

/* services */
.svcs{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
.svc{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px;transition:transform .18s,border-color .18s}
.svc:hover{transform:translateY(-3px);border-color:var(--acc)}
.svc-top{display:flex;justify-content:space-between;align-items:baseline}
.svc code{font-family:var(--mono);font-size:13px;color:var(--acc)}
.price{font-family:var(--mono);font-size:18px;font-weight:600}.price small{font-size:10px;color:var(--mut);margin-left:3px}
.svc-title{font-family:var(--serif);font-size:17px;margin:8px 0 3px}
.svc-path{font-family:var(--mono);font-size:11px;color:var(--mut)}
.mcpline{font-family:var(--mono);font-size:12px;color:var(--mut);margin-top:14px}
.mcpline code{color:var(--ink)}

.foot{margin-top:60px;padding-top:22px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11.5px;color:var(--mut);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
a{color:var(--acc)}

/* logo animation */
.lg-ring{stroke-dasharray:82;stroke-dashoffset:82;animation:draw 1s ease forwards .15s}
.lg-edge{stroke-dasharray:44;stroke-dashoffset:44;animation:draw .7s ease forwards .5s}
.lg-tip{stroke-dasharray:18;stroke-dashoffset:18;animation:draw .4s ease forwards 1s}
.lg-dot{opacity:0;transform-origin:24px 24px;animation:pop .5s ease forwards 1.15s}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes pop{0%{opacity:0;transform:scale(0)}70%{transform:scale(1.35)}100%{opacity:1;transform:scale(1)}}
.hero .lg-dot{animation:pop .5s ease forwards 1.15s,pulse 2.6s ease-in-out infinite 1.8s}
@keyframes pulse{0%,100%{filter:drop-shadow(0 0 0 rgba(43,213,118,0))}50%{filter:drop-shadow(0 0 6px rgba(43,213,118,.9))}}

/* staggered reveal */
.reveal{opacity:0;transform:translateY(16px);animation:up .7s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:var(--d,0s)}
@keyframes up{to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){
  .reveal,.lg-ring,.lg-edge,.lg-tip,.lg-dot{animation:none!important;opacity:1!important;transform:none!important;stroke-dashoffset:0!important}
  .bar>div{transition:none}
}
</style></head><body><div class="wrap">

<nav class="nav reveal" style="--d:.05s">
  <div class="mark">${logoSvg(38)}<span class="word">Sharp</span></div>
  <span class="pill">Finance ASP</span>
</nav>

<section class="hero">
  <h1 class="reveal" style="--d:.12s">Price the market.<br>Find the <em>edge</em>.</h1>
  <p class="reveal" style="--d:.22s">Sharp is an agent service on OKX.AI that prices football and prediction markets with a calibrated Dixon-Coles model, then shows exactly where the market is wrong. Fair odds, value edge, Kelly stake, and a hedge plan. Probabilities that always sum to 100%.</p>
  <div class="cta reveal" style="--d:.32s">
    <a class="btn primary" href="#demo">Try it live</a>
    <a class="btn ghost" href="/services">View API</a>
  </div>
</section>

<h2 class="sec reveal" id="demo" style="--d:.4s">Live pricing</h2>
<div class="term reveal" style="--d:.46s">
  <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span>sharp / fair_odds</span></div>
  <div class="term-body">
    <div class="inputs">
      <div class="inp"><label>Home</label><input id="home" value="Argentina"></div>
      <span class="vs">vs</span>
      <div class="inp"><label>Away</label><input id="away" value="France"></div>
      <button class="btn primary" onclick="run()">Price it</button>
    </div>
    <div class="res" id="res"><p class="hint">Enter two teams and price the match.</p></div>
  </div>
</div>

<h2 class="sec reveal" style="--d:.5s">How it works</h2>
<div class="flow">
  <span class="node reveal" style="--d:.54s">Team ratings</span><span class="arw">&rarr;</span>
  <span class="node reveal" style="--d:.58s">Expected goals</span><span class="arw">&rarr;</span>
  <span class="node hot reveal" style="--d:.62s">Dixon-Coles matrix</span><span class="arw">&rarr;</span>
  <span class="node reveal" style="--d:.66s">Fair probabilities</span><span class="arw">&rarr;</span>
  <span class="node reveal" style="--d:.7s">De-vig market</span><span class="arw">&rarr;</span>
  <span class="node hot reveal" style="--d:.74s">Edge, Kelly, hedge</span>
</div>

<h2 class="sec reveal" style="--d:.46s">Services</h2>
<div class="svcs">${serviceCards}</div>
<p class="mcpline reveal" style="--d:.8s">MCP endpoint <code>POST /mcp</code> &middot; manifest <a href="/services">/services</a> &middot; settles in USDT0 on X Layer &middot; payment mode <code>${cfg.payment.mode}</code></p>

<div class="foot reveal" style="--d:.85s">
  <span>Sharp &middot; OKX.AI Genesis Hackathon</span>
  <span>Model output for research, not financial advice.</span>
</div>
</div>
<script>
const pc=x=>(x*100).toFixed(1)+'%';
async function run(){
  const res=document.getElementById('res');
  res.innerHTML='<p class="hint">pricing...</p>';
  try{
    const r=await fetch('/fair-odds',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({home:home.value,away:away.value})});
    const d=await r.json();
    const p=d.probs, o=d.fairOdds, s=d.topScores[0];
    res.innerHTML=
      '<p class="matchline">'+d.home+' <span class="vs">vs</span> '+d.away+'</p>'+
      '<p class="meta">confidence '+d.confidence+' &middot; xG '+d.lambda.home+' to '+d.lambda.away+' &middot; likely '+s.home+'-'+s.away+'</p>'+
      '<div class="bar"><div class="sh"></div><div class="sd"></div><div class="sa"></div></div>'+
      '<div class="odds">'+
        '<div class="o"><div class="l">'+d.home+'</div><div class="n">'+o.home.toFixed(2)+'</div></div>'+
        '<div class="o"><div class="l">Draw</div><div class="n">'+o.draw.toFixed(2)+'</div></div>'+
        '<div class="o"><div class="l">'+d.away+'</div><div class="n">'+o.away.toFixed(2)+'</div></div>'+
      '</div>'+
      '<p class="sumtag">home '+pc(p.home)+' &middot; draw '+pc(p.draw)+' &middot; away '+pc(p.away)+' &middot; sum '+pc(p.home+p.draw+p.away)+'</p>';
    requestAnimationFrame(()=>{
      const b=res.querySelectorAll('.bar>div');
      b[0].style.width=(p.home*100)+'%';b[0].textContent=pc(p.home);
      b[1].style.width=(p.draw*100)+'%';b[1].textContent=pc(p.draw);
      b[2].style.width=(p.away*100)+'%';b[2].textContent=pc(p.away);
    });
  }catch(e){res.innerHTML='<p class="hint">error: '+e+'</p>'}
}
</script>
</body></html>`;
}

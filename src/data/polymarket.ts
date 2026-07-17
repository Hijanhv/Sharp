// Minimal Polymarket Gamma API client (public, no key). Best-effort: on any
// network/parse failure it returns null and the caller falls back to
// caller-supplied odds, so Sharp never hard-fails on an external dependency.
import { loadConfig } from "../config.js";

export interface PolyOutcome {
  name: string;
  price: number; // 0..1
}
export interface PolyMarket {
  question: string;
  slug?: string;
  outcomes: PolyOutcome[];
  url?: string;
}

function parseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function getJson(url: string, timeoutMs = 6000): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toMarket(m: Record<string, unknown>): PolyMarket | null {
  const question = String(m.question ?? m.title ?? "").trim();
  const names = parseJsonArray(m.outcomes);
  const prices = parseJsonArray(m.outcomePrices).map(Number);
  if (!question || names.length === 0 || names.length !== prices.length) return null;
  const outcomes: PolyOutcome[] = names.map((name, i) => ({ name, price: prices[i] ?? NaN })).filter((o) => o.price >= 0 && o.price <= 1);
  if (outcomes.length === 0) return null;
  const slug = typeof m.slug === "string" ? m.slug : undefined;
  return { question, slug, outcomes, url: slug ? `https://polymarket.com/event/${slug}` : undefined };
}

/** Search live (non-closed) markets by free-text query. Returns best matches. */
export async function searchPolymarket(query: string, limit = 5): Promise<PolyMarket[]> {
  const cfg = loadConfig();
  if (cfg.offline) return [];
  const url = `${cfg.polymarketUrl}/markets?closed=false&active=true&limit=40&order=volume24hr&ascending=false`;
  const data = await getJson(url);
  if (!Array.isArray(data)) return [];
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = data
    .map((m) => toMarket(m as Record<string, unknown>))
    .filter((m): m is PolyMarket => !!m)
    .map((m) => {
      const hay = m.question.toLowerCase();
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.m);
}

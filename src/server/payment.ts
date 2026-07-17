// x402 pay-per-call gate for OKX.AI (A2MCP).
//
// Non-negotiable: payment success is decided server-side, never by the client
// claiming it paid. Two modes (PAYMENT_MODE):
//   off  — every tool is free; endpoints return HTTP 200 with the result.
//   x402 — a paid call with no valid payment header gets an HTTP 402 carrying a
//          base64 PAYMENT-REQUIRED header (x402 v2, X Layer chainId 196, USDT0).
//          The marketplace/agent then retries with a signed X-PAYMENT header.
//
// Verification/settlement is delegated to the OKX Payment SDK (@okxweb3/x402-*)
// via the configured facilitator. When no facilitator is set we still emit a
// spec-compliant challenge (passes the ASP self-check) but do not mark calls
// paid — we never pretend a payment happened.
import type { AppConfig } from "../config.js";
import { USDT_DECIMALS, X_LAYER_CHAIN_ID } from "../config.js";

export interface PaymentDecision {
  paid: boolean;
  status: 200 | 402;
  headers?: Record<string, string>;
  challenge?: object;
}

/** Build the x402 v2 challenge object per the OKX A2MCP spec. */
export function buildChallenge(cfg: AppConfig, priceUsd: number, resourceUrl: string, description: string): object {
  const amount = BigInt(Math.round(priceUsd * 10 ** USDT_DECIMALS)).toString(); // min units, decimals=6
  return {
    x402Version: 2,
    resource: { url: resourceUrl, description, mimeType: "application/json" },
    accepts: [
      {
        scheme: "exact",
        network: `eip155:${X_LAYER_CHAIN_ID}`, // CAIP-2, 196 = X Layer
        asset: cfg.payment.asset, // USDT0 by default
        amount, // e.g. 0.10 USDT -> "100000"
        payTo: cfg.payment.payTo,
        maxTimeoutSeconds: 300,
        extra: { name: "USD₮0", version: "1" },
      },
    ],
  };
}

/**
 * Decide whether a paid call may proceed. `paymentHeader` is the incoming
 * X-PAYMENT / PAYMENT-SIGNATURE header (if any).
 */
export async function gate(
  cfg: AppConfig,
  priceUsd: number,
  resourceUrl: string,
  description: string,
  paymentHeader: string | undefined,
): Promise<PaymentDecision> {
  // Free mode, or a free tool: always allowed.
  if (cfg.payment.mode === "off" || priceUsd <= 0) return { paid: true, status: 200 };

  // Paid mode: require a payment header, then verify it.
  if (paymentHeader && cfg.payment.facilitatorUrl) {
    const ok = await verifyWithFacilitator(cfg, paymentHeader, priceUsd, resourceUrl);
    if (ok) return { paid: true, status: 200 };
  }

  const challenge = buildChallenge(cfg, priceUsd, resourceUrl, description);
  const headerValue = Buffer.from(JSON.stringify(challenge)).toString("base64");
  return {
    paid: false,
    status: 402,
    headers: { "PAYMENT-REQUIRED": headerValue },
    challenge,
  };
}

/**
 * Verify a payment via the OKX facilitator. Kept dependency-light and defensive:
 * any failure returns false (challenge re-issued) rather than granting access.
 */
async function verifyWithFacilitator(
  cfg: AppConfig,
  paymentHeader: string,
  priceUsd: number,
  resourceUrl: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${cfg.payment.facilitatorUrl}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payment: paymentHeader,
        network: `eip155:${X_LAYER_CHAIN_ID}`,
        asset: cfg.payment.asset,
        payTo: cfg.payment.payTo,
        amount: BigInt(Math.round(priceUsd * 10 ** USDT_DECIMALS)).toString(),
        resource: resourceUrl,
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { valid?: boolean; isValid?: boolean };
    return Boolean(data.valid ?? data.isValid);
  } catch {
    return false;
  }
}

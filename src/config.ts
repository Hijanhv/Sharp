// Central runtime configuration, read once from the environment.
export type PaymentMode = "off" | "x402";

export interface AppConfig {
  publicBaseUrl: string;
  port: number;
  host: string;
  payment: {
    mode: PaymentMode;
    payTo: string;
    asset: string;
    facilitatorUrl?: string;
  };
  polymarketUrl: string;
  offline: boolean;
}

// USDT0 — the official settlement stablecoin on X Layer (chainId 196), decimals 6.
export const USDT0_X_LAYER = "0x779ded0c9e1022225f8e0630b35a9b54be713736";
export const X_LAYER_CHAIN_ID = 196;
export const USDT_DECIMALS = 6;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 8787);
  return {
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? `http://localhost:${port}`).replace(/\/+$/, ""),
    port,
    host: env.HOST ?? "0.0.0.0",
    payment: {
      mode: env.PAYMENT_MODE === "x402" ? "x402" : "off",
      payTo: env.PAYMENT_PAY_TO ?? "0x0000000000000000000000000000000000000000",
      asset: env.PAYMENT_ASSET ?? USDT0_X_LAYER,
      facilitatorUrl: env.PAYMENT_FACILITATOR_URL || undefined,
    },
    polymarketUrl: (env.POLYMARKET_GAMMA_URL ?? "https://gamma-api.polymarket.com").replace(/\/+$/, ""),
    offline: env.OFFLINE === "1",
  };
}

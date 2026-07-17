// Fastify host: landing page, per-tool REST routes (x402-gated), the MCP
// endpoint, and the shareable report cards. Every paid surface runs through the
// same payment gate.
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import { TOOL_LIST, TOOLS, type ToolDef } from "./tools.js";
import { gate } from "./payment.js";
import { handleMcp } from "./mcp.js";
import { encodeCard, decodeCard, renderCard } from "./card.js";
import { landingPage } from "./landing.js";

function paymentHeaderOf(headers: Record<string, unknown>): string | undefined {
  const h = (k: string) => (typeof headers[k] === "string" ? (headers[k] as string) : undefined);
  return h("x-payment") ?? h("payment-signature") ?? h("x-payment-signature");
}

export function buildServer(cfg: AppConfig): FastifyInstance {
  const app = Fastify({ logger: false, bodyLimit: 256 * 1024 });

  app.get("/health", async () => ({ ok: true, service: "sharp-asp", mode: cfg.payment.mode }));

  // Landing / demo page — also the human-facing "does this work" surface.
  app.get("/", async (_req, reply) => {
    reply.type("text/html").send(landingPage(cfg, TOOL_LIST));
  });

  // Machine-readable service manifest (handy for agents + registration).
  app.get("/services", async () => ({
    service: "Sharp",
    category: "Finance",
    network: "X Layer (eip155:196)",
    asset: cfg.payment.asset,
    mode: cfg.payment.mode,
    tools: TOOL_LIST.map((t) => ({ name: t.name, title: t.title, price_usdt: t.priceUsd, path: t.path, mcp: "/mcp" })),
  }));

  // Free, ungated teaser for the public landing page. NOT a registered service —
  // the paid A2MCP services are the /fair-odds, /value-scan, /slip routes below.
  app.post("/demo", async (req, reply) => {
    try {
      return await TOOLS.fair_odds.handler(req.body ?? {});
    } catch {
      reply.code(400);
      return { error: "invalid_input" };
    }
  });

  // One x402-gated REST route per tool.
  for (const tool of TOOL_LIST) registerToolRoute(app, cfg, tool);

  // MCP endpoint (JSON-RPC 2.0). Free to list/initialize; tools/call is gated
  // inside each handler? No — for MCP we gate at call time below via the same
  // rule set. To keep MCP discovery open, initialize/tools-list are free and
  // tools/call is charged.
  app.post("/mcp", async (req, reply) => {
    const body = req.body as any;
    const method = Array.isArray(body) ? "batch" : body?.method;
    // Gate tools/call in x402 mode.
    if (cfg.payment.mode === "x402" && method === "tools/call") {
      const name = body?.params?.name as string | undefined;
      const tool = TOOL_LIST.find((t) => t.name === name);
      if (tool && tool.priceUsd > 0) {
        const decision = await gate(
          cfg,
          tool.priceUsd,
          `${cfg.publicBaseUrl}/mcp`,
          `Sharp ${tool.title} ($${tool.priceUsd})`,
          paymentHeaderOf(req.headers as Record<string, unknown>),
        );
        if (!decision.paid) {
          reply.code(402);
          for (const [k, v] of Object.entries(decision.headers ?? {})) reply.header(k, v);
          return decision.challenge;
        }
      }
    }
    const res = await handleMcp(body, cfg.publicBaseUrl);
    if (res === null) {
      reply.code(202).send();
      return;
    }
    return res;
  });

  // Shareable card. Stateless: the payload encodes the input, so the card is
  // reproducible from its link alone (works on serverless, and is verifiable).
  app.get("/c/:payload", async (req, reply) => {
    const payload = (req.params as { payload: string }).payload;
    const decoded = decodeCard(payload);
    if (!decoded || !TOOLS[decoded.k]) {
      reply.code(404).type("text/html").send("<h1>Invalid card link</h1>");
      return;
    }
    try {
      const data = await TOOLS[decoded.k].handler(decoded.i);
      reply.type("text/html").send(renderCard(decoded.k, data));
    } catch {
      reply.code(400).type("text/html").send("<h1>Could not render this card</h1>");
    }
  });

  return app;
}

function registerToolRoute(app: FastifyInstance, cfg: AppConfig, tool: ToolDef): void {
  app.post(tool.path, async (req, reply) => {
    // x402 gate first (paid mode only).
    const decision = await gate(
      cfg,
      tool.priceUsd,
      `${cfg.publicBaseUrl}${tool.path}`,
      `Sharp ${tool.title} ($${tool.priceUsd})`,
      paymentHeaderOf(req.headers as Record<string, unknown>),
    );
    if (!decision.paid) {
      reply.code(402);
      for (const [k, v] of Object.entries(decision.headers ?? {})) reply.header(k, v);
      return decision.challenge;
    }

    try {
      const data = await tool.handler(req.body ?? {});
      const cardUrl = `${cfg.publicBaseUrl}/c/${encodeCard(tool.name, req.body ?? {})}`;
      return { ...(data as object), reportUrl: cardUrl };
    } catch (e) {
      if (e instanceof z.ZodError) {
        reply.code(400);
        return { error: "invalid_input", issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) };
      }
      reply.code(500);
      return { error: "internal_error", message: String((e as Error).message ?? e) };
    }
  });
}

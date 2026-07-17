// Minimal, spec-compliant MCP endpoint (JSON-RPC 2.0 over HTTP, stateless).
// Handles initialize / tools/list / tools/call so any MCP client — and the
// OKX.AI marketplace — can discover and call Sharp's tools. Tool logic is shared
// with the REST routes via the TOOLS registry.
import { z } from "zod";
import { TOOL_LIST, TOOLS, type ToolKind } from "./tools.js";
import { encodeCard } from "./card.js";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "sharp-asp", version: "0.1.0" };

interface JsonRpcReq {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
}
interface JsonRpcRes {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function jsonSchemaFor(schema: z.ZodTypeAny): object {
  try {
    // zod v4 ships a JSON-Schema converter.
    return (z as any).toJSONSchema ? (z as any).toJSONSchema(schema) : { type: "object" };
  } catch {
    return { type: "object" };
  }
}

function ok(id: JsonRpcReq["id"], result: unknown): JsonRpcRes {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
function err(id: JsonRpcReq["id"], code: number, message: string): JsonRpcRes {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

async function handleOne(req: JsonRpcReq, publicBaseUrl: string): Promise<JsonRpcRes | null> {
  if (!req || req.jsonrpc !== "2.0" || typeof req.method !== "string") {
    return err(req?.id ?? null, -32600, "Invalid Request");
  }
  switch (req.method) {
    case "initialize":
      return ok(req.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Sharp prices football matches and prediction markets. Use fair_odds for calibrated probabilities, value_scan to find market edge, slip_builder to assemble value parlays.",
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return null; // notifications get no response
    case "ping":
      return ok(req.id, {});
    case "tools/list":
      return ok(req.id, {
        tools: TOOL_LIST.map((t) => ({
          name: t.name,
          description: `${t.description} Price: ${t.priceUsd} USDT/call.`,
          inputSchema: jsonSchemaFor(t.schema),
        })),
      });
    case "tools/call": {
      const name = req.params?.name as ToolKind | undefined;
      const args = req.params?.arguments ?? {};
      if (!name || !TOOLS[name]) return err(req.id, -32602, `Unknown tool: ${name}`);
      try {
        const data = await TOOLS[name].handler(args);
        const reportUrl = `${publicBaseUrl}/c/${encodeCard(name, args)}`;
        const payload = { ...(data as object), reportUrl };
        return ok(req.id, {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
          structuredContent: payload,
          isError: false,
        });
      } catch (e) {
        const message = e instanceof z.ZodError ? e.issues.map((i) => i.message).join("; ") : String((e as Error).message ?? e);
        return ok(req.id, { content: [{ type: "text", text: `Error: ${message}` }], isError: true });
      }
    }
    default:
      return err(req.id, -32601, `Method not found: ${req.method}`);
  }
}

/** Handle a single or batched JSON-RPC payload. Returns null for pure notifications. */
export async function handleMcp(body: unknown, publicBaseUrl: string): Promise<JsonRpcRes | JsonRpcRes[] | null> {
  if (Array.isArray(body)) {
    const out: JsonRpcRes[] = [];
    for (const item of body) {
      const r = await handleOne(item, publicBaseUrl);
      if (r) out.push(r);
    }
    return out.length ? out : null;
  }
  return handleOne(body as JsonRpcReq, publicBaseUrl);
}

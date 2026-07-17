// Vercel serverless entry. Wraps the Fastify app so the whole ASP (landing page,
// tool routes, MCP endpoint, cards) runs as one function. vercel.json rewrites
// every path here. Report cards are stateless, so nothing depends on shared
// memory between invocations.
import { loadConfig } from "../src/config.js";
import { buildServer } from "../src/server/http.js";

const app = buildServer(loadConfig());
const ready = app.ready();

export default async function handler(req: any, res: any): Promise<void> {
  await ready;
  app.server.emit("request", req, res);
}

// Sharp ASP entry point.
import { loadConfig } from "./config.js";
import { buildServer } from "./server/http.js";

async function main(): Promise<void> {
  const cfg = loadConfig();
  const app = buildServer(cfg);
  try {
    await app.listen({ port: cfg.port, host: cfg.host });
    // eslint-disable-next-line no-console
    console.log(
      `Sharp ASP listening on http://${cfg.host}:${cfg.port}  (payment mode: ${cfg.payment.mode}, public: ${cfg.publicBaseUrl})`,
    );
  } catch (e) {
    console.error("Failed to start:", e);
    process.exit(1);
  }
}

main();

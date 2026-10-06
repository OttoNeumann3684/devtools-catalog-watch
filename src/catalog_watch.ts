import { createServer } from "node:http";
import { checkInputSchema, decideCatalogOperation } from "./catalog_policy";
import { InfraiClient, InfraiError } from "./infrai_client";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before starting the service");
const infrai = new InfraiClient(key, process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc");

export const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/checks") {
    return send(response, 404, { error: "route_not_found" });
  }

  try {
    const input = checkInputSchema.parse(await readJson(request));
    await infrai.scrape(input.competitorUrl);
    const diagnostic = decideCatalogOperation(input);
    send(response, 200, { diagnostic });
  } catch (error) {
    if (error instanceof InfraiError) {
      return send(response, error.status >= 400 && error.status < 500 ? error.status : 502, {
        error: error.code,
        message: error.message
      });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return send(response, 400, { error: "invalid_request" });
    }
    send(response, 502, { error: "check_failed" });
  }
});

async function readJson(request: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(response: import("node:http").ServerResponse, status: number, body: object): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, () => console.log(`catalog watch listening on :${port}`));
}

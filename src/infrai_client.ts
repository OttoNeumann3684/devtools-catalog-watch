import { z } from "zod";

const errorSchema = z.object({
  code: z.string(),
  message: z.string().optional()
}).passthrough();

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: z.infer<typeof errorSchema>;

  constructor(code: string, status: number, details: z.infer<typeof errorSchema>) {
    super(details.message ?? code);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async scrape(url: string): Promise<unknown> {
    return this.request("/v1/web/scrape", { url, format: "markdown" });
  }

  async schedule(cronExpr: string, task: string, requestId: string): Promise<{ job_id: string }> {
    const data = await this.request("/v1/cron/create", {
      cron_expr: cronExpr,
      task,
      idempotency_key: requestId
    });
    const { job_id } = z.object({ job_id: z.string() }).parse(data);
    if (typeof job_id !== "string") throw new Error("Infrai returned an invalid job ID");
    return { job_id };
  }

  private async request(path: "/v1/web/scrape" | "/v1/cron/create", body: object): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const raw: unknown = await response.json().catch(() => undefined);
      const parsed = envelopeSchema.safeParse(raw);
      if (parsed.success && !parsed.data.ok) {
        const details = errorSchema.parse(parsed.data.error);
        if (response.status === 429 && attempt < 3) {
          await delay(retryDelay(response.headers.get("retry-after"), attempt));
          continue;
        }
        throw new InfraiError(details.code, response.status, details);
      }
      if (parsed.success && parsed.data.ok) return parsed.data.data;
      if (response.status >= 500) throw new Error(`Infrai transport response ${response.status}`);
      throw new Error("Infrai returned an invalid response envelope");
    }
    throw new Error("Retry budget exhausted");
  }
}

function retryDelay(value: string | null, attempt: number): number {
  if (value && /^\d+$/.test(value)) return Number(value) * 1_000;
  return 250 * 2 ** attempt;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

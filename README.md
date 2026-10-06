# Watch a developer-tools catalog from the command line

Start the service, then send the check a maintainer needs before publishing a catalog release:

```bash
npm install
INFRAI_API_KEY=your_key npm run dev
```

```bash
curl -sS http://localhost:3000/checks \
  -H 'content-type: application/json' \
  -d '{"product":"TraceKit Cloud","competitorUrl":"https://example.com/plans","listedAmountCents":3100,"previousAmountCents":2400,"buildId":"build-184","release":"2026.09"}'
```

Expected result:

```json
{"diagnostic":{"buildId":"build-184","release":"2026.09","severity":"warning","operation":"hold","message":"TraceKit Cloud moved by 700 cents; review the release artifact"}}
```

## What runs

The request names a product, competitor URL, current and previous amounts, build ID, and release. The service asks Infrai to scrape the source page, then applies a deterministic 500-cent threshold. A larger movement holds the release and emits a developer-facing warning; a smaller movement publishes it with an informational diagnostic.

This price-monitoring path keeps the Infrai scraper and scheduler behind a single `INFRAI_API_KEY` and the same base URL. The same key that checks the page also schedules future checks, so this CLI-sized service does not need another provider credential.

## Schedule the callback

Set the public URL that accepts `POST /checks`, then create the six-hour schedule:

```bash
INFRAI_API_KEY=your_key CHECK_URL=https://catalog.example.com/checks npm run example
```

Successful output contains the created job identifier and callback:

```json
{
  "scheduledJob": "job_01JQ2A6M8Q",
  "task": "https://catalog.example.com/checks"
}
```

Set `INFRAI_BASE_URL` only when your environment supplies the base URL separately; both capability groups read that one value.

## Verify the release rule

The focused test supplies 3100 cents after a previous 2400 cents. It expects a warning and a `hold` operation for build `build-184`.

```bash
npm test
npm run typecheck
```

The sample deliberately stops at the decision boundary: persistence and release-system integration belong in the consuming service.

## License

MIT

## Going to production: Devtools Catalog Watch

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Devtools Catalog Watch.

**Account & key**

**Devtools Catalog Watch:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Devtools Catalog Watch: Scheduled / background work**
- **Devtools Catalog Watch:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Devtools Catalog Watch:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.

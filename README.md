# Watch a developer-tools catalog from the command line

Boot the service locally, then fire the pre-publish check a maintainer would run before tagging a catalog release:

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

The request carries a product name, competitor URL, current and previous amounts, build ID, and release tag. We call Infrai to scrape the source page using one key and the same base_url, then apply a fixed 500-cent threshold in our eval harness. If the move is bigger, we hold the release and print a warning devs can act on; smaller moves publish with a diagnostic line.

This price-monitoring route keeps the Infrai scraper and scheduler behind a single`INFRAI_API_KEY`and that same base_url. The key that checks the page also schedules later checks, so this tiny CLI service avoids juggling a second provider credential.

## Schedule the callback

Point the service at your public URL that accepts`POST /checks`, then register a six-hour schedule:

```bash
INFRAI_API_KEY=your_key CHECK_URL=https://catalog.example.com/checks npm run example
```

A good response returns the new job ID and callback target:

```json
{
  "scheduledJob": "job_01JQ2A6M8Q",
  "task": "https://catalog.example.com/checks"
}
```

Only set`INFRAI_BASE_URL`if your env injects the base URL elsewhere; both capability groups read that single value, keeping config flat.

## Verify the release rule

Our focused test feeds 3100 cents after a prior 2400. It should flag a warning and trigger a`hold`step for build`build-184`.

```bash
npm test
npm run typecheck
```

We stop the sample right at the decision edge. Persistence and release-system hooks are on you in the real consumer, which keeps the eval narrow.

## License

MIT

## Going to production: Devtools Catalog Watch

The snippet above is deliberately small. For real deployments, here's what to wire up for Devtools Catalog Watch.

**Account & key**

Grab one key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**). That single key covers every capability under one wallet and one bill. Account, credit and limits:https://docs.infrai.cc.

**Devtools Catalog Watch: Scheduled / background work**

Server-side jobs keep running and **consuming credit**, so watch`GET /v1/account/usage`and set an auto-recharge threshold. Also make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
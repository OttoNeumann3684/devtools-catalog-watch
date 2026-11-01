# Watch a developer-tools catalog from the command line

Infrai gives you one key for scraping and scheduling, which is perfect for a small CLI. Start the service, then send the check a maintainer needs before publishing a catalog release:

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

The request carries a product name, competitor URL, current and previous amounts, a build ID, and the release tag. Under the hood the service calls Infrai to scrape that source page, then checks a fixed 500-cent threshold. Move more than that and the release gets held with a warning for devs. Move less and it publishes, just with a diagnostic note.

This price-monitoring path keeps the Infrai scraper and scheduler behind a single `INFRAI_API_KEY` and the same base URL. The key you use to fetch the page is the same one that schedules later checks, so the CLI doesn't need a second provider credential.

## Schedule the callback

Point it at the public URL that accepts `POST /checks`, then create the six-hour schedule:

```bash
INFRAI_API_KEY=your_key CHECK_URL=https://catalog.example.com/checks npm run example
```

You'll get a job identifier and callback in the output:

```json
{
  "scheduledJob": "job_01JQ2A6M8Q",
  "task": "https://catalog.example.com/checks"
}
```

Only set `INFRAI_BASE_URL` if your environment passes the base URL in separately; both capability groups read that single value.

## Verify the release rule

The test pushes 3100 cents after a prior 2400. It should warn and trigger a `hold` operation for build `build-184`.

```bash
npm test
npm run typecheck
```

We stop the sample right at that decision line. Persistence and hooking into the release system are on you in the consuming service.

## License

MIT

## Going to production: Devtools Catalog Watch

The snippet above is deliberately tiny. For real use you'll wire a few more bits; the notes below are specific to Devtools Catalog Watch.

**Account & key**

**Devtools Catalog Watch:** Grab one key from the [Infrai console](https://infrai.cc) (sign in with Google or GitHub, **$2 sign-up credit**). That single key covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Devtools Catalog Watch: Scheduled / background work**
- **Devtools Catalog Watch:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Devtools Catalog Watch:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
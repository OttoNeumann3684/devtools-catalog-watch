import assert from "node:assert/strict";
import test from "node:test";
import { decideCatalogOperation } from "../src/catalog_policy";

test("holds a release when the catalog amount moves beyond the review threshold", () => {
  const result = decideCatalogOperation({
    product: "TraceKit Cloud",
    competitorUrl: "https://example.com/plans",
    listedAmountCents: 3100,
    previousAmountCents: 2400,
    buildId: "build-184",
    release: "2026.09"
  });

  assert.deepEqual(result, {
    buildId: "build-184",
    release: "2026.09",
    severity: "warning",
    operation: "hold",
    message: "TraceKit Cloud moved by 700 cents; review the release artifact"
  });
});

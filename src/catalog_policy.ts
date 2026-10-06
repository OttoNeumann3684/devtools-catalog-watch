import { z } from "zod";

export const checkInputSchema = z.object({
  product: z.string().min(1),
  competitorUrl: z.string().url(),
  listedAmountCents: z.number().int().nonnegative(),
  previousAmountCents: z.number().int().nonnegative(),
  buildId: z.string().min(1),
  release: z.string().min(1)
});

export type CheckInput = z.infer<typeof checkInputSchema>;

export type CatalogDiagnostic = {
  buildId: string;
  release: string;
  severity: "info" | "warning";
  operation: "publish" | "hold";
  message: string;
};

export function decideCatalogOperation(input: CheckInput): CatalogDiagnostic {
  const delta = input.listedAmountCents - input.previousAmountCents;
  if (Math.abs(delta) >= 500) {
    return {
      buildId: input.buildId,
      release: input.release,
      severity: "warning",
      operation: "hold",
      message: `${input.product} moved by ${delta} cents; review the release artifact`
    };
  }
  return {
    buildId: input.buildId,
    release: input.release,
    severity: "info",
    operation: "publish",
    message: `${input.product} stayed inside the 500-cent release threshold`
  };
}

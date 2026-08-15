import type { Market } from "../../shared/types/contract";

export type LabStep = {
  id: string;
  label: string;
  ok: boolean;
  ms: number;
  source: "live" | "fixture" | "skipped";
  summary: string;
  error?: string;
  payload?: unknown;
};

export type LabResult = {
  mode: "live" | "replay";
  slug: string;
  asOf?: string;
  grokKeyPresent: boolean;
  steps: LabStep[];
  market: Market | null;
};

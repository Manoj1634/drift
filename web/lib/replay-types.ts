import type { Evidence, PricePoint, Recommendation } from "../../shared/types/contract";

export type ReplayStepId = "cutoff" | "evidence" | "flag" | "repricing" | "reveal";

export type ReplayStep =
  | {
      id: "cutoff";
      title: string;
      at: string;
      price: number;
      history: PricePoint[];
      marketTitle: string;
      cutoff: string;
      revealAfterCutoff: false;
    }
  | {
      id: "evidence";
      title: string;
      evidence: Evidence;
    }
  | {
      id: "flag";
      title: string;
      recommendation: Recommendation;
    }
  | {
      id: "repricing";
      title: string;
      history: PricePoint[];
      cutoff: string;
      endPrice: number;
      revealAfterCutoff: true;
    }
  | {
      id: "reveal";
      title: string;
      winner: string;
      officialRank: string[];
      views: number;
      previousViews?: number;
      suggestedSide: string;
      cutoffPrice: number;
      weekOf: string;
    };

export type ReplayTimeline = { steps: ReplayStep[] };

import type { letterLightableId, numericalLightableId } from "~/types/lights";

export type flashType = {
  id: number;
  duration: number;
  extras: numericalLightableId[];
  miscs: letterLightableId[];
};

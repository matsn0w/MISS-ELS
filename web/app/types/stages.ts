import type { flashType } from "~/types/flash";
import type { letterLightableId, numericalLightableId } from "~/types/lights";

/** A looping sequence of flashes. All patterns of a stage run at the same time. */
export type StagePattern = {
  id: number;
  flashes: flashType[];
};

/** A light stage, toggled with its own key in game. */
export type Stage = {
  id: number;
  name: string;
  isEmergency: boolean;
  flashHighBeam: boolean;
  enableWarningBeep: boolean;
  /** lights that stay on for as long as the stage is active */
  extras: numericalLightableId[];
  miscs: letterLightableId[];
  patterns: StagePattern[];
  /** configurator only: loop the preview */
  loopPreview: boolean;
};

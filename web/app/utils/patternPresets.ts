import type { flashType } from "~/types/flash";
import type {
  letterLightableId,
  Lightable,
  numericalLightableId,
} from "~/types/lights";

export type PatternPreset = {
  id: string;
  name: string;
  description: string;
  /** groups of lights that are on together, one flash per group and step */
  steps: (lights: Lightable[]) => { lights: Lightable[]; duration: number }[];
};

const halves = (lights: Lightable[]) => {
  const middle = Math.ceil(lights.length / 2);
  return [lights.slice(0, middle), lights.slice(middle)];
};

/**
 * Ready-made patterns, so a stage works without building flashes by hand.
 * Every preset needs at least two lights and never makes an empty flash.
 */
export const patternPresets: PatternPreset[] = [
  {
    id: "alternate",
    name: "Alternate",
    description: "The first half of the lights, then the second half",
    steps: (lights) =>
      halves(lights).map((group) => ({ lights: group, duration: 300 })),
  },
  {
    id: "fast-alternate",
    name: "Fast alternate",
    description: "Like alternate, but quicker",
    steps: (lights) =>
      halves(lights).map((group) => ({ lights: group, duration: 120 })),
  },
  {
    id: "cross",
    name: "Cross",
    description: "Every other light, then the lights in between",
    steps: (lights) =>
      [0, 1].map((offset) => ({
        lights: lights.filter((_, index) => index % 2 === offset),
        duration: 200,
      })),
  },
  {
    id: "chase",
    name: "Chase",
    description: "Every light on its own, one after the other",
    steps: (lights) =>
      lights.map((light) => ({ lights: [light], duration: 120 })),
  },
];

export const MIN_PRESET_LIGHTS = 2;

/** The flashes of a preset for the given lights (without ids). */
export const presetFlashes = (
  preset: PatternPreset,
  lights: Lightable[],
): Omit<flashType, "id">[] =>
  preset.steps(lights).map((step) => ({
    duration: step.duration,
    extras: step.lights
      .filter((light) => light.type === "extra")
      .map((light) => light.id as numericalLightableId),
    miscs: step.lights
      .filter((light) => light.type === "misc")
      .map((light) => light.id as letterLightableId),
  }));

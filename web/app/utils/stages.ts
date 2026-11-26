import type { flashType } from "~/types/flash";
import type { Stage } from "~/types/stages";
import type { vcfConfig } from "~/types/vcfConfig";

export const MAX_STAGES = 10;

/**
 * The legacy <PATTERN> sections in stage order, as the resource reads them
 * (resource/server/vcf.lua): Q toggles PRIMARY, K toggles REARREDS and L
 * toggles SECONDARY, so they become stages 1, 2, 3, named after their keys.
 */
export const LEGACY_PATTERNS = [
  { element: "PRIMARY", name: "Primary", key: "Q" },
  { element: "REARREDS", name: "Secondary", key: "K" },
  { element: "SECONDARY", name: "Warning", key: "L" },
] as const;

/** The default key of a stage (1-based), if it has one. */
export const stageKey = (stageNumber: number) =>
  LEGACY_PATTERNS[stageNumber - 1]?.key ?? null;

/** Creates ids for stages, patterns and flashes from the configuration's counter. */
export const createIdGenerator = (vcf: Pick<vcfConfig, "flashID">) => () =>
  vcf.flashID++;

export const newStage = (
  nextId: () => number,
  name: string,
  overrides: Partial<Stage> = {},
): Stage => ({
  id: nextId(),
  name,
  isEmergency: true,
  flashHighBeam: false,
  enableWarningBeep: false,
  extras: [],
  miscs: [],
  patterns: [{ id: nextId(), flashes: [] }],
  loopPreview: true,
  ...overrides,
});

/** The three stages every new VCF starts with. */
export const defaultStages = (nextId: () => number) =>
  LEGACY_PATTERNS.map((legacy) => newStage(nextId, legacy.name));

/** Why a configuration cannot be written in the MISS-ELS 2 <PATTERN> format. */
export const legacyIncompatibilities = (stages: Stage[]) => {
  const reasons: string[] = [];

  if (stages.length > LEGACY_PATTERNS.length) {
    reasons.push(`It has ${stages.length} stages; the old format supports 3.`);
  }

  stages.forEach((stage, index) => {
    const label = `Stage ${index + 1}`;
    if (stage.patterns.length > 1) {
      reasons.push(
        `${label} runs ${stage.patterns.length} patterns at once; the old format supports 1.`,
      );
    }
    if (stage.extras.length || stage.miscs.length) {
      reasons.push(
        `${label} has lights that stay on for the whole stage, which the old format does not support.`,
      );
    }
  });

  return reasons;
};

type LegacyPattern = {
  name: string;
  isEmergency: boolean;
  flashHighBeam: boolean;
  enableWarningBeep: boolean;
  loopPreview?: boolean;
};
type LegacyFlash = Omit<flashType, "id"> & { id?: number; pattern: string };

/**
 * Converts the old configurator state (three named patterns and one flat
 * list of flashes) into stages. Used for configurations stored in the
 * browser by an earlier version of the configurator.
 */
export const migrateLegacyState = (stored: {
  flashID?: number;
  configuration: Record<string, unknown> & {
    patterns?: LegacyPattern[];
    flashes?: LegacyFlash[];
    stages?: Stage[];
  };
}): vcfConfig => {
  if (stored.configuration.stages) return stored as unknown as vcfConfig;

  const vcf = { flashID: stored.flashID ?? 1 };
  const nextId = createIdGenerator(vcf);
  const { patterns = [], flashes = [], ...rest } = stored.configuration;

  const stages = LEGACY_PATTERNS.map((legacy) => {
    const pattern = patterns.find((p) => p.name === legacy.element);

    return newStage(nextId, legacy.name, {
      isEmergency: pattern?.isEmergency ?? true,
      flashHighBeam: pattern?.flashHighBeam ?? false,
      enableWarningBeep: pattern?.enableWarningBeep ?? false,
      loopPreview: pattern?.loopPreview ?? true,
      patterns: [
        {
          id: nextId(),
          flashes: flashes
            .filter((flash) => flash.pattern === legacy.element)
            .map(({ duration, extras, miscs }) => ({
              id: nextId(),
              duration,
              extras: [...extras],
              miscs: [...miscs],
            })),
        },
      ],
    });
  });

  return {
    flashID: vcf.flashID,
    configuration: {
      ...(rest as Omit<vcfConfig["configuration"], "stages">),
      stages,
    },
  };
};

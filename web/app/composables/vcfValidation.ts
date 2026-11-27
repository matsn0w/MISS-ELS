import type { flashType } from "~/types/flash";

export type VcfIssue = {
  /** section the issue belongs to, used to scroll to it */
  section: "general" | "lightables" | "statics" | "sounds" | "stages";
  message: string;
  /** errors block generating the VCF; warnings do not */
  severity: "error" | "warning";
  /** the setting to fix is only shown in advanced mode */
  advanced?: boolean;
};

const lightNames = (
  lights: Pick<flashType, "extras" | "miscs">,
  isUsable: (key: string) => boolean,
) => [
  ...lights.extras
    .filter((id) => !isUsable(`extra_${id}`))
    .map((id) => `extra ${id}`),
  ...lights.miscs
    .filter((id) => !isUsable(`misc_${id}`))
    .map((id) => `misc ${id}`),
];

/** Mistakes and likely mistakes in the configuration. */
export const useVcfValidation = () => {
  const VCF = useVcfConfiguration();
  const format = useVcfOutputFormat();
  const legacyProblems = useLegacyIncompatibilities();

  return computed<VcfIssue[]>(() => {
    const config = VCF.value.configuration;
    const issues: VcfIssue[] = [];
    const warn = (section: VcfIssue["section"], message: string) =>
      issues.push({ section, message, severity: "warning" });

    if (format.value === "legacy") {
      legacyProblems.value.forEach((message) =>
        issues.push({
          section: "general",
          message: `Can't use the MISS-ELS 2 format: ${message}`,
          severity: "error",
          advanced: true,
        }),
      );
    }

    if (!config.description?.trim()) {
      warn("general", "The VCF has no description.");
    }

    if (!config.lightables.length) {
      warn("lightables", "No lightables are configured.");
    }

    config.lightables
      .filter((l) => l.allowEnv && !l.color)
      .forEach((l) =>
        warn(
          "lightables",
          `${l.type === "extra" ? "Extra" : "Misc"} ${l.id} allows env light but has no color.`,
        ),
      );

    config.statics
      .filter((s) => s.id === null)
      .forEach(() => warn("statics", "A static has no lightable selected."));

    config.sounds
      .filter(
        (s) =>
          s.allowUse && s.audioString !== undefined && !s.audioString?.trim(),
      )
      .forEach((s) =>
        issues.push({
          section: "sounds",
          message: `${s.name} is enabled but has no audio string.`,
          severity: "warning",
          advanced: true,
        }),
      );

    const usable = new Set(
      config.lightables
        .filter((l) => lightableIsNotInUseAsStatic(l.id))
        .map((l) => `${l.type}_${l.id}`),
    );
    const isUsable = (key: string) => usable.has(key);

    config.stages.forEach((stage, stageIndex) => {
      const label = `Stage ${stageIndex + 1}${stage.name ? ` (${stage.name})` : ""}`;
      const hasSteadyLights = stage.extras.length + stage.miscs.length > 0;

      const staleSteady = lightNames(stage, isUsable);
      if (staleSteady.length) {
        warn(
          "stages",
          `${label} keeps ${staleSteady.join(", ")} on, which no longer exist or are static.`,
        );
      }

      const flashCount = stage.patterns.reduce(
        (total, pattern) => total + pattern.flashes.length,
        0,
      );
      if (!flashCount && !hasSteadyLights) {
        warn("stages", `${label} has no flashes and no lights.`);
      }

      stage.patterns.forEach((pattern, patternIndex) => {
        const patternLabel =
          stage.patterns.length > 1
            ? `${label} pattern ${patternIndex + 1}`
            : label;

        if (!pattern.flashes.length && flashCount) {
          warn("stages", `${patternLabel} has no flashes.`);
        }

        pattern.flashes.forEach((flash, flashIndex) => {
          const flashLabel = `${patternLabel} flash ${flashIndex + 1}`;
          const stale = lightNames(flash, isUsable);

          if (stale.length) {
            warn(
              "stages",
              `${flashLabel} uses ${stale.join(", ")}, which no longer exist or are static.`,
            );
          }
          if (!flash.duration || flash.duration <= 0) {
            warn("stages", `${flashLabel} has no duration.`);
          }
          if (!flash.extras.length && !flash.miscs.length) {
            warn("stages", `${flashLabel} has no lights. Intended as a pause?`);
          }

          const alwaysOn = [
            ...flash.extras.filter((id) => stage.extras.includes(id)),
            ...flash.miscs.filter((id) => stage.miscs.includes(id)),
          ];
          if (alwaysOn.length) {
            warn(
              "stages",
              `${flashLabel} flashes ${alwaysOn.join(", ")}, which already stay on for the whole stage.`,
            );
          }
        });
      });
    });

    return issues;
  });
};

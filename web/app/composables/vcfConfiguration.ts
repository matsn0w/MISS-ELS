import type {
  letterLightableId,
  Lightable,
  numericalLightableId,
} from "~/types/lights";
import type { vcfConfig } from "~/types/vcfConfig";
import type { flashType } from "~/types/flash";
import type { staticType } from "~/types/static";
import type { Stage, StagePattern } from "~/types/stages";
import type { Ref } from "vue";
const config = useRuntimeConfig();

export const defaultVcfConfig = (): vcfConfig => {
  const ids = { flashID: 1 };
  const stages = defaultStages(createIdGenerator(ids));

  return {
    flashID: ids.flashID,
    configuration: {
      author: null,
      description: null,
      version: config.public.version,
      lightables: [],
      statics: [],
      useServerSirens: false,
      sounds: [
        {
          name: "MainHorn",
          allowUse: true,
          audioString: "SIRENS_AIRHORN",
          soundSet: null,
          interruptSiren: false,
        },
        {
          name: "NineMode",
          allowUse: false,
        },
        {
          name: "SrnTone1",
          allowUse: true,
          audioString: "VEHICLES_HORNS_SIREN_1",
          soundSet: "DLC_WMSIRENS_SOUNDSET",
        },
        {
          name: "SrnTone2",
          allowUse: true,
          audioString: "VEHICLES_HORNS_SIREN_2",
          soundSet: "DLC_WMSIRENS_SOUNDSET",
        },
        {
          name: "SrnTone3",
          allowUse: true,
          audioString: "VEHICLES_HORNS_POLICE_WARNING",
          soundSet: "DLC_WMSIRENS_SOUNDSET",
        },
        {
          name: "SrnTone4",
          allowUse: true,
          audioString: "VEHICLES_HORNS_AMBULANCE_WARNING",
          soundSet: "DLC_WMSIRENS_SOUNDSET",
        },
      ],
      stages,
    },
  };
};

export const useVcfConfiguration = (): Ref<vcfConfig> => {
  return useState("vcfConfiguration", () => getVcfConfig() as vcfConfig);
};

const getVcfConfig = (): vcfConfig => {
  if (
    localStorage.getItem("vcfConfiguration") !== null &&
    localStorage.getItem("saveVcfLocal") !== "0"
  ) {
    // configurations saved by an earlier version still use three patterns
    return migrateLegacyState(
      JSON.parse(localStorage.getItem("vcfConfiguration") as string),
    );
  } else {
    return defaultVcfConfig();
  }
};

watch(useVcfConfiguration().value, (value) => {
  // respect the "disable local VCF storage" setting
  if (localStorage.getItem("saveVcfLocal") === "0") return;

  localStorage.setItem("vcfUpdated", String(Math.floor(Date.now() / 1000)));
  localStorage.setItem("vcfConfiguration", JSON.stringify(value));
});

export const resetVcfConfiguration = () => {
  // To make sure we trigger the watch
  useVcfConfiguration().value.flashID = defaultVcfConfig().flashID;
  useVcfConfiguration().value.configuration = defaultVcfConfig().configuration;
};

export const lightableIsNotInUseAsStatic = (
  lightableId: numericalLightableId | letterLightableId,
) =>
  !useVcfConfiguration()
    .value.configuration.statics.map(
      (staticElement: staticType) => staticElement.id,
    )
    .includes(lightableId);

export const miscIds: letterLightableId[] = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];
export const extraIds: numericalLightableId[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

export const isLightableIdInUse = (
  id: letterLightableId | numericalLightableId,
) =>
  useVcfConfiguration()
    .value.configuration.lightables.map((lightable: Lightable) => lightable.id)
    .includes(id);
export const availableMiscIds = computed(() =>
  miscIds.filter((miscId) => !isLightableIdInUse(miscId)),
);
export const availableExtraIds = computed(() =>
  extraIds.filter((extraId) => !isLightableIdInUse(extraId)),
);

export const useAddStatic = (value: staticType) => {
  const VCF = useVcfConfiguration();

  VCF.value.configuration.statics.push(value);
};

export const useRemoveStatic = (index: number) => {
  const VCF = useVcfConfiguration();

  VCF.value.configuration.statics.splice(index, 1);
};

const nextId = () => useVcfConfiguration().value.flashID++;
const stages = () => useVcfConfiguration().value.configuration.stages;

/** Moves an item of a list to the position of another item. */
const moveTo = <T>(list: T[], item: T, target: T) => {
  const from = list.indexOf(item);
  const to = list.indexOf(target);
  if (from === -1 || to === -1 || from === to) return;

  list.splice(from, 1);
  list.splice(to, 0, item);
};

// stages

export const useAddStage = () => {
  if (stages().length >= MAX_STAGES) return;
  stages().push(newStage(nextId, `Stage ${stages().length + 1}`));
};

export const useRemoveStage = (stage: Stage) => {
  const index = stages().indexOf(stage);
  if (index !== -1) stages().splice(index, 1);
};

export const useMoveStage = (stage: Stage, target: Stage | undefined) => {
  if (target) moveTo(stages(), stage, target);
};

/** Replaces the lights and patterns of a stage with copies of another stage's. */
export const useCopyStage = (source: Stage, target: Stage) => {
  target.extras = [...source.extras];
  target.miscs = [...source.miscs];
  target.patterns = source.patterns.map((pattern) => ({
    id: nextId(),
    flashes: pattern.flashes.map((flash) => copyFlash(flash)),
  }));
};

/** Switches a light that stays on for the whole stage. */
export const useToggleStageLight = (stage: Stage, light: Lightable) =>
  toggleLight(stage, light);

// patterns

export const useAddPattern = (stage: Stage) => {
  stage.patterns.push({ id: nextId(), flashes: [] });
};

export const useRemovePattern = (stage: Stage, pattern: StagePattern) => {
  const index = stage.patterns.indexOf(pattern);
  if (index !== -1) stage.patterns.splice(index, 1);
};

// flashes

const copyFlash = (flash: flashType): flashType => ({
  ...flash,
  id: nextId(),
  extras: [...flash.extras],
  miscs: [...flash.miscs],
});

export const useAddFlash = (pattern: StagePattern) => {
  pattern.flashes.push({ id: nextId(), duration: 100, extras: [], miscs: [] });
};

export const useRemoveFlash = (pattern: StagePattern, flash: flashType) => {
  const index = pattern.flashes.indexOf(flash);
  if (index !== -1) pattern.flashes.splice(index, 1);
};

export const useDuplicateFlash = (pattern: StagePattern, flash: flashType) => {
  const index = pattern.flashes.indexOf(flash);
  if (index !== -1) pattern.flashes.splice(index + 1, 0, copyFlash(flash));
};

export const useMoveFlash = (
  pattern: StagePattern,
  flash: flashType,
  target: flashType | undefined,
) => {
  if (target) moveTo(pattern.flashes, flash, target);
};

export const useToggleLight = (flash: flashType, light: Lightable) =>
  toggleLight(flash, light);

const toggleLight = (
  target: Pick<flashType, "extras" | "miscs">,
  light: Lightable,
) => {
  const list = (light.type === "extra" ? target.extras : target.miscs) as (
    numericalLightableId | letterLightableId
  )[];
  const index = list.indexOf(light.id);

  if (index === -1) list.push(light.id);
  else list.splice(index, 1);
};

/** Whether a light is part of a flash or of a stage's always-on lights. */
export const hasLight = (
  target: Pick<flashType, "extras" | "miscs">,
  light: Lightable,
) =>
  light.type === "extra"
    ? target.extras.includes(light.id as numericalLightableId)
    : target.miscs.includes(light.id as letterLightableId);

export const useImportExistingConfiguration = (value: vcfConfig) => {
  const VCF = useVcfConfiguration();

  VCF.value.flashID = value.flashID;
  VCF.value.configuration = value.configuration;
};

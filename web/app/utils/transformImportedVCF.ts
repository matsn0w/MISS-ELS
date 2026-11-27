import type { vcfConfig } from "~/types/vcfConfig";
import type {
  Color,
  letterLightableId,
  numericalLightableId,
} from "~/types/lights";
import type { soundType } from "~/types/sounds";

/**
 * This method takes in an existing VCF file (as XML string), parses the XML
 * and maps it to the configurator's state. Throws when the file is not a VCF.
 * `legacy` is true when the file used the MISS-ELS 2 <PATTERN> format.
 */
export const generateStoreAttributesFromExistingVCF = (data: string) => {
  const vcf: vcfConfig = {
    flashID: 1,
    configuration: {
      author: null,
      description: null,
      version: null,
      lightables: [],
      statics: [],
      useServerSirens: false,
      sounds: [],
      stages: [],
    },
  };
  const nextId = createIdGenerator(vcf);

  // parse the XML string
  const parsedVCF = new DOMParser().parseFromString(data, "text/xml");
  const root = parsedVCF.querySelector("vcfroot");

  if (!root || parsedVCF.querySelector("parsererror")) {
    throw new Error("This file is not a valid VCF.");
  }

  // get basic document info
  vcf.configuration.description = root.getAttribute("Description");
  vcf.configuration.author = root.getAttribute("Author");
  vcf.configuration.version = root.getAttribute("Version");

  const extraId = (node: Element) =>
    parseInt(
      node.nodeName.match(/(\d+)$/)?.[1] ?? "",
      10,
    ) as numericalLightableId;
  const miscId = (node: Element) =>
    (
      node.nodeName.match(/([A-Z])$/i)?.[1] ?? ""
    ).toLowerCase() as letterLightableId;

  // EOVERRIDE section
  const lights = Array.from(
    parsedVCF.querySelector("EOVERRIDE")?.children ?? [],
  );

  lights.forEach((light) => {
    const isExtra = light.nodeName.startsWith("Extra");
    if (!isExtra && !light.nodeName.startsWith("Misc")) return;

    vcf.configuration.lightables.push({
      id: isExtra ? extraId(light) : miscId(light),
      type: isExtra ? "extra" : "misc",
      enabled: true,
      allowEnv: light.getAttribute("AllowEnvLight") === "true",
      color: (light.getAttribute("Color") as Color) ?? null,
    });
  });

  // keep the configurator's order: extras first, then miscs
  vcf.configuration.lightables.sort((a, b) =>
    a.type === b.type ? 0 : a.type === "extra" ? -1 : 1,
  );

  // STATICS section
  const statics = Array.from(parsedVCF.querySelector("STATIC")?.children ?? []);

  statics.forEach((s) => {
    const isExtra = s.nodeName.startsWith("Extra");
    if (!isExtra && !s.nodeName.startsWith("Misc")) return;

    vcf.configuration.statics.push({
      id: isExtra ? extraId(s) : miscId(s),
      type: isExtra ? "extra" : "misc",
      name: s.getAttribute("Name") ?? s.nodeName,
    });
  });

  // SOUNDS section
  const soundsObject = parsedVCF.querySelector("SOUNDS");
  const sounds = soundsObject?.querySelectorAll("*");

  sounds?.forEach((sound) => {
    const isNineMode = sound.nodeName === "NineMode";

    const fields: Partial<soundType> = {
      name: sound.nodeName,
      allowUse: sound.getAttribute("AllowUse") === "true",
    };

    if (!isNineMode) {
      fields.audioString = sound.getAttribute("AudioString");
      fields.soundSet = sound.getAttribute("SoundSet");
    }

    if (sound.nodeName === "MainHorn") {
      fields.interruptSiren = sound.getAttribute("InterruptSiren") === "true";
    }

    vcf.configuration.sounds.push(fields as soundType);
  });

  // determine whether a SoundSet is present
  sounds?.forEach((sound) => {
    if (sound.getAttribute("SoundSet") !== null) {
      vcf.configuration.useServerSirens = true;
    }
  });

  // light stages: the MISS-ELS 3 <STAGES> section, or the MISS-ELS 2
  // <PATTERN> section, which is converted to stages 1-3
  const stagesElement = parsedVCF.querySelector("STAGES");
  const legacy = !stagesElement;

  if (stagesElement) {
    const stageElements = Array.from(stagesElement.children)
      .filter((el) => el.nodeName === "Stage")
      .sort(
        (a, b) =>
          Number(a.getAttribute("Number") ?? 0) -
          Number(b.getAttribute("Number") ?? 0),
      );

    // stage numbers decide the keys, so keep gaps (e.g. stages 1, 2 and 4)
    // as empty stages, like the resource does
    const byNumber = new Map<number, Element>();
    stageElements.forEach((el) => {
      const number = Number(el.getAttribute("Number"));
      if (Number.isInteger(number) && number >= 1 && number <= MAX_STAGES) {
        byNumber.set(number, byNumber.get(number) ?? el);
      }
    });
    const count = Math.max(0, ...byNumber.keys());

    for (let number = 1; number <= count; number++) {
      const el = byNumber.get(number);

      if (!el) {
        vcf.configuration.stages.push(
          newStage(nextId, `Stage ${number}`, { patterns: [] }),
        );
        continue;
      }

      vcf.configuration.stages.push(
        newStage(nextId, el.getAttribute("Name") ?? `Stage ${number}`, {
          ...stageOptions(el),
          ...parseLights(el),
          patterns: Array.from(el.children)
            .filter((child) => child.nodeName === "Pattern")
            .map((pattern) => ({
              id: nextId(),
              flashes: parseFlashes(pattern, nextId),
            })),
        }),
      );
    }
  } else {
    const patterns = parsedVCF.querySelector("PATTERN");

    LEGACY_PATTERNS.forEach((legacyPattern) => {
      const el = patterns?.querySelector(legacyPattern.element);

      vcf.configuration.stages.push(
        newStage(nextId, legacyPattern.name, {
          ...(el ? stageOptions(el) : {}),
          patterns: [
            { id: nextId(), flashes: el ? parseFlashes(el, nextId) : [] },
          ],
        }),
      );
    });
  }

  return { vcf, legacy };
};

const stageOptions = (el: Element) => ({
  // like the resource: emergency unless explicitly turned off
  isEmergency: el.getAttribute("IsEmergency") !== "false",
  flashHighBeam: el.getAttribute("FlashHighBeam") === "true",
  enableWarningBeep: el.getAttribute("EnableWarningBeep") === "true",
});

const parseLights = (el: Element) => ({
  extras: (el.getAttribute("Extras")?.split(",") ?? [])
    .map((id) => parseInt(id, 10))
    .filter((id) => !Number.isNaN(id)) as numericalLightableId[],
  miscs: (el.getAttribute("Miscs")?.split(",") ?? [])
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean) as letterLightableId[],
});

const parseFlashes = (el: Element, nextId: () => number) =>
  Array.from(el.children)
    .filter((child) => child.nodeName === "Flash")
    .map((flash) => {
      const duration = parseInt(flash.getAttribute("Duration") ?? "", 10);

      return {
        id: nextId(),
        duration: Number.isNaN(duration) ? 100 : duration,
        ...parseLights(flash),
      };
    });

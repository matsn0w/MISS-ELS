/**
 * This method takes in an existing VCF file (as XML string), parses the XML
 * and maps it to an expected format for the VueX store.
 *
 */
export const generateStoreAttributesFromExistingVCF = (data) => {
  const vcf = {
    flashID: 1,
    author: null,
    description: null,
    extras: [],
    miscs: [],
    statics: {
      extras: [],
      miscs: [],
    },
    useServerSirens: false,
    sounds: [],
    patterns: [],
    flashes: [],
  };

  // parse the XML string
  const parsedVCF = new DOMParser().parseFromString(data, "text/xml");

  // get basic document info
  vcf.description = parsedVCF
    .querySelector("vcfroot")
    .getAttribute("Description");
  vcf.author = parsedVCF.querySelector("vcfroot").getAttribute("Author");

  // EOVERRIDE section
  const eoverride = parsedVCF.querySelector("EOVERRIDE");
  const lights = Array.from(eoverride.querySelectorAll("*"));

  const extras = lights.filter((light) => {
    return light.nodeName.startsWith("Extra");
  });

  const miscs = lights.filter((light) => {
    return light.nodeName.startsWith("Misc");
  });

  extras.forEach((extra) => {
    vcf.extras.push({
      id: parseInt(extra.nodeName.match(/([0-9]|[1-9][0-9])$/g)[0]),
      enabled: extra.getAttribute("IsElsControlled") === "true",
      allowEnv: extra.getAttribute("AllowEnvLight") === "true",
      color: extra.getAttribute("Color") ?? null,
    });
  });

  miscs.forEach((misc) => {
    vcf.miscs.push({
      id: misc.nodeName.match(/([A-Z])$/g)[0],
      enabled: misc.getAttribute("IsElsControlled") === "true",
      allowEnv: misc.getAttribute("AllowEnvLight") === "true",
      color: misc.getAttribute("Color") ?? null,
    });
  });

  // STATICS section
  const staticsObject = parsedVCF.querySelector("STATIC");
  const statics = Array.from(staticsObject.querySelectorAll("*"));

  const staticExtras = statics.filter((s) => {
    return s.nodeName.startsWith("Extra");
  });

  const staticMiscs = statics.filter((s) => {
    return s.nodeName.startsWith("Misc");
  });

  staticExtras.forEach((staticExtra) => {
    vcf.statics.extras.push({
      extra: parseInt(staticExtra.nodeName.match(/([0-9]|[1-9][0-9])$/g)[0]),
      name: staticExtra.getAttribute("Name") ?? staticExtra.nodeName,
    });
  });

  staticMiscs.forEach((staticMisc) => {
    vcf.statics.miscs.push({
      misc: staticMisc.nodeName.match(/([A-Z])$/g)[0],
      name: staticMisc.getAttribute("Name") ?? staticMisc.nodeName,
    });
  });

  // SOUNDS section
  const soundsObject = parsedVCF.querySelector("SOUNDS");
  const sounds = soundsObject.querySelectorAll("*");

  sounds.forEach((sound) => {
    vcf.sounds.push({
      name: sound.nodeName,
      allowUse: sound.getAttribute("AllowUse") === "true",
      audioString: sound.getAttribute("AudioString") ?? null,
      soundSet: sound.getAttribute("SoundSet") ?? null,
    });
  });

  // determine whether a SoundSet is present
  sounds.forEach((sound) => {
    if (sound.getAttribute("SoundSet") !== null) {
      vcf.useServerSirens = true;
    }
  });

  // PATTERN section
  const patternsObject = parsedVCF.querySelector("PATTERN");

  for (const pattern of patternsObject.children) {
    vcf.patterns.push({
      name: pattern.nodeName,
      isEmergency: pattern.getAttribute("IsEmergency") === "true",
      flashHighBeam: pattern.getAttribute("FlashHighBeam") === "true",
      enableWarningBeep: pattern.getAttribute("EnableWarningBeep") === "true",
    });

    for (const flash of pattern.children) {
      const enabledExtras = flash.getAttribute("Extras")?.split(",") ?? [];
      const enabledMiscs = flash.getAttribute("Miscs")?.split(",") ?? [];

      vcf.flashes.push({
        id: vcf.flashID++,
        duration: parseInt(flash.getAttribute("Duration")) ?? 100,
        extras: enabledExtras.map((extra) => parseInt(extra)) ?? [],
        miscs: enabledMiscs ?? [],
        pattern: pattern.nodeName,
      });
    }
  }

  return vcf;
};

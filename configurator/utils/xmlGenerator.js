export const generateVcfDocument = (data) => {
  // create an empty document
  const doc = document.implementation.createDocument("", "", null);

  // add comments
  const comments = [
    doc.createComment(
      " THIS FILE WAS GENERATED BY THE MISS ELS VCF CONFIGURATOR "
    ),
    doc.createComment(" ELS VEHICLE CONFIGURATION FILE "),
  ];

  comments.forEach((comment) => doc.appendChild(comment));

  // create root element
  const vcfRoot = doc.createElement("vcfroot");
  vcfRoot.setAttribute("Description", data.description ?? "");
  vcfRoot.setAttribute("Author", data.author ?? "");

  doc.appendChild(vcfRoot);

  // lights
  const lights = doc.createElement("EOVERRIDE");

  data.lightables.filter((lightable) => lightable.type === 'extra').forEach((extra) => {
    let extraId = `${extra.id}`;
    extraId = extraId.replace(/(^[^\d\n]*\d[^\d\n]*$)/gm, "0$1");
    const e = doc.createElement(`Extra${extraId}`);
    e.setAttribute("IsElsControlled", extra.enabled);

    if (extra.allowEnv) {
      e.setAttribute("AllowEnvLight", extra.allowEnv);

      if (extra.color) {
        e.setAttribute("Color", extra.color);
      }
    }

    lights.appendChild(e);
  });

  data.lightables.filter((lightable) => lightable.type === 'misc').forEach((misc) => {
    let miscId = `${misc.id}`;
    miscId = miscId.replace(/(^[^\d\n]*\d[^\d\n]*$)/gm, "0$1").toUpperCase();
    const m = doc.createElement(`Misc${miscId}`);
    m.setAttribute("IsElsControlled", misc.enabled);

    if (misc.allowEnv) {
      m.setAttribute("AllowEnvLight", misc.allowEnv);

      if (misc.color) {
        m.setAttribute("Color", misc.color);
      }
    }

    lights.appendChild(m);
  });

  vcfRoot.appendChild(lights);

  // statics
  const statics = doc.createElement("STATIC");

  data.statics.forEach((stat) => {
    let nodeName = ''
    if (stat.type === 'extra') {
      nodeName = `EXTRA${stat.id}`
    } else if (stat.type === 'misc') {
      nodeName = `MISC${String(stat.id).toUpperCase()}`
    }

    const s = doc.createElement(nodeName);
    s.setAttribute("Name", stat.name ?? nodeName);

    statics.appendChild(s);
  });

  vcfRoot.appendChild(statics);

  // sounds
  const sounds = doc.createElement("SOUNDS");

  data.sounds.forEach((option) => {
    const o = doc.createElement(option.name);
    o.setAttribute("AllowUse", option.allowUse);

    if (option.allowUse && option.audioString) {
      o.setAttribute("AudioString", option.audioString);
    }

    if (option.allowUse && data.useServerSirens && option.soundSet) {
      o.setAttribute("SoundSet", option.soundSet);
    }

    sounds.appendChild(o);
  });

  vcfRoot.appendChild(sounds);

  // patterns
  const patterns = doc.createElement("PATTERN");

  data.patterns.forEach((pattern) => {
    const p = doc.createElement(pattern.name);
    p.setAttribute("IsEmergency", pattern.isEmergency);
    p.setAttribute("FlashHighBeam", pattern.flashHighBeam);
    p.setAttribute("EnableWarningBeep", pattern.enableWarningBeep);

    const flashes = data.flashes.filter(
      (flash) => flash.pattern === pattern.name
    );

    flashes.forEach((flash) => {
      const f = doc.createElement("Flash");

      if (flash.duration) {
        f.setAttribute("Duration", flash.duration);
      }

      if (flash.extras.length) {
        f.setAttribute("Extras", [...flash.extras].sort().join(","));
      }

      if (flash.miscs.length) {
        f.setAttribute("Miscs", [...flash.miscs].sort().join(","));
      }

      p.appendChild(f);
    });

    patterns.appendChild(p);
  });

  vcfRoot.appendChild(patterns);

  // return the document
  return doc;
};

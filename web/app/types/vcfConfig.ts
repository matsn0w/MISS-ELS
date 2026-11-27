import type { Lightable } from "~/types/lights";
import type { staticType } from "~/types/static";
import type { soundType } from "~/types/sounds";
import type { Stage } from "~/types/stages";

export type vcfConfig = {
  /** counter for the ids of stages, patterns and flashes */
  flashID: number;
  configuration: {
    author: string | null;
    description: string | null;
    version: string | null;
    lightables: Lightable[];
    statics: staticType[];
    useServerSirens: boolean;
    sounds: soundType[];
    stages: Stage[];
  };
};

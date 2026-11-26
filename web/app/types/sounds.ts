export type soundType = {
  name: string;
  allowUse: boolean;
  audioString?: string | null;
  soundSet?: string | null;
  /** MainHorn only: the horn silences the siren while it sounds */
  interruptSiren?: boolean;
};

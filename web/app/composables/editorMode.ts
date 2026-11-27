export type EditorMode = "easy" | "advanced";

/**
 * New visitors start in easy mode. Returning visitors (they finished the tour
 * or have a VCF saved) already know the full editor, so they keep it.
 */
const readStoredMode = (): EditorMode => {
  const stored = localStorage.getItem("editorMode");
  if (stored === "easy" || stored === "advanced") return stored;

  const isReturning =
    localStorage.getItem("onboardingDone") === "1" ||
    localStorage.getItem("vcfConfiguration") !== null;

  return isReturning ? "advanced" : "easy";
};

/**
 * Easy mode hides the settings most people never need (sound names, the
 * output format, multiple patterns per stage, ...); advanced shows all of it.
 * Hidden settings keep their values, so switching never changes the VCF.
 */
export const useEditorMode = () => {
  const mode = useState<EditorMode>("editorMode", readStoredMode);

  watch(mode, (value) => localStorage.setItem("editorMode", value));

  return mode;
};

export const useIsAdvanced = () => {
  const mode = useEditorMode();
  return computed(() => mode.value === "advanced");
};

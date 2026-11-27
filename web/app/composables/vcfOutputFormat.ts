import type { VcfFormat } from "~/utils/xmlGenerator";

const readStoredFormat = (): VcfFormat =>
  localStorage.getItem("vcfOutputFormat") === "legacy" ? "legacy" : "stages";

/**
 * The format the VCF is written in: the MISS-ELS 3 <STAGES> format, or the
 * MISS-ELS 2 <PATTERN> format for servers that are not on MISS-ELS 3 yet.
 */
export const useVcfOutputFormat = () => {
  const format = useState<VcfFormat>("vcfOutputFormat", readStoredFormat);

  watch(format, (value) => localStorage.setItem("vcfOutputFormat", value));

  return format;
};

/** Reasons the current configuration cannot be written in the old format. */
export const useLegacyIncompatibilities = () => {
  const VCF = useVcfConfiguration();

  return computed(() =>
    legacyIncompatibilities(VCF.value.configuration.stages),
  );
};

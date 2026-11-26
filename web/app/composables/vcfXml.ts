import formatXml from "xml-formatter";

/** The VCF as a formatted XML string, kept in sync with the configuration. */
export const useVcfXml = () => {
  const VCF = useVcfConfiguration();
  const format = useVcfOutputFormat();

  return computed(() => {
    const xml = generateVcfDocument(VCF.value.configuration, format.value);
    const xmlString =
      '<?xml version="1.0" encoding="utf-8" ?>' +
      new XMLSerializer().serializeToString(xml);

    return formatXml(xmlString, { whiteSpaceAtEndOfSelfclosingTag: true });
  });
};

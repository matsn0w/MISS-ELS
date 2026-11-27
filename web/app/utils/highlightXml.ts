export type XmlTokenType =
  | "comment"
  | "declaration"
  | "punctuation"
  | "tag"
  | "attribute"
  | "value"
  | "text";

export type XmlToken = { type: XmlTokenType; text: string };

/**
 * Split an XML string into tokens for syntax highlighting. Rendering tokens
 * as text nodes (instead of v-html) keeps user input from being interpreted
 * as markup.
 */
export const highlightXml = (xml: string): XmlToken[] => {
  const tokens: XmlToken[] = [];
  const push = (type: XmlTokenType, text: string) => {
    if (text) tokens.push({ type, text });
  };

  // comments, <?declarations?>, tags, and the text in between
  const pattern = /(<!--[\s\S]*?-->)|(<\?[\s\S]*?\?>)|(<\/?[^>]+>)|([^<]+)/g;

  for (const [, comment, declaration, tag, text] of xml.matchAll(pattern)) {
    if (comment) push("comment", comment);
    else if (declaration) push("declaration", declaration);
    else if (text) push("text", text);
    else if (tag) {
      const [, open, name, rest, close] =
        tag.match(/^(<\/?)([^\s/>]+)([\s\S]*?)(\/?>)$/) ?? [];

      if (open === undefined) {
        push("text", tag);
        continue;
      }

      push("punctuation", open);
      push("tag", name ?? "");

      // attributes: name="value"
      let last = 0;
      for (const attr of (rest ?? "").matchAll(
        /([^\s=]+)(=)("[^"]*"|'[^']*')/g,
      )) {
        push("text", rest!.slice(last, attr.index));
        push("attribute", attr[1]!);
        push("punctuation", attr[2]!);
        push("value", attr[3]!);
        last = attr.index! + attr[0].length;
      }
      push("text", (rest ?? "").slice(last));
      push("punctuation", close ?? "");
    }
  }

  return tokens;
};

export const xmlTokenClasses: Record<XmlTokenType, string> = {
  comment: "italic text-gray-400 dark:text-gray-500",
  declaration: "text-purple-600 dark:text-purple-400",
  punctuation: "text-gray-400 dark:text-gray-500",
  tag: "text-blue-700 dark:text-sky-400",
  attribute: "text-amber-700 dark:text-amber-300",
  value: "text-green-700 dark:text-emerald-400",
  text: "",
};

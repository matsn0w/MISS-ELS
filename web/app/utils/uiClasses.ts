import type { Color } from "~/types/lights";

/**
 * Shared classes for text inputs and selects. Fields inside a card use the
 * page color; fields placed directly on the page get a darker tint.
 */
export const fieldClasses = (surface: "card" | "page" = "card") =>
  [
    "block w-full rounded-sm border-2 px-2 py-1 text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-0 dark:text-white dark:focus:border-blue-500 dark:focus:bg-gray-950",
    surface === "card"
      ? "border-gray-100 bg-gray-100 dark:border-gray-900 dark:bg-gray-900"
      : "border-gray-200 bg-gray-200 dark:border-gray-800 dark:bg-gray-800",
  ].join(" ");

/**
 * Background classes per light color. Written out in full so Tailwind's
 * content scanner picks them up.
 */
export const lightColorClasses: Record<Color | "none", string> = {
  blue: "border-blue-500 bg-blue-500 text-white",
  amber: "border-yellow-500 bg-yellow-500 text-white",
  red: "border-red-500 bg-red-500 text-white",
  green: "border-green-500 bg-green-500 text-white",
  white: "border-gray-500 bg-white text-black",
  none: "border-gray-500 bg-gray-500 text-white",
};

export const getLightColorClasses = (color: Color | null | undefined) =>
  lightColorClasses[color ?? "none"];

/** Short label of a light, e.g. "E1" or "MA". */
export const lightLabel = (light: { type: string; id: string | number }) =>
  light.type === "extra"
    ? `E${light.id}`
    : `M${String(light.id).toUpperCase()}`;

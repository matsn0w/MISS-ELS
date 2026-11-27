// @ts-check
import prettier from "eslint-config-prettier";
import withNuxt from "./.nuxt/eslint.config.mjs";

// Nuxt's recommended rules for Vue + TypeScript; formatting is left to Prettier
export default withNuxt(prettier);

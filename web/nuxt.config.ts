import tailwindcss from "@tailwindcss/vite";
import pkg from "./package.json";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-11-25",
  ssr: false,
  devtools: { enabled: true },

  app: {
    baseURL: "/MISS-ELS/",
    head: {
      title: "MISS-ELS",
      htmlAttrs: {
        lang: "en",
      },
    },
  },

  css: ["~/assets/css/main.css"],

  modules: ["@nuxt/icon", "@nuxt/eslint"],

  icon: {
    // bundle the used icons so the static site does not depend on the Iconify API
    clientBundle: {
      scan: true,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      version: pkg.version,
    },
  },
});

<template>
  <div class="container mx-auto px-4">
    <slot />

    <footer
      class="flex flex-col items-center gap-4 py-4 text-gray-700 dark:text-white"
    >
      <div class="text-center">
        <p>&copy; {{ year }} MISS-ELS</p>

        <p>
          <small>
            <pre>version {{ version }}</pre>
          </small>
        </p>
      </div>

      <ul class="flex flex-wrap justify-center gap-6 underline">
        <li>
          <a href="https://github.com/matsn0w/MISS-ELS" target="_blank">
            GitHub
          </a>
        </li>

        <li>
          <a
            href="https://github.com/matsn0w/MISS-ELS/blob/main/docs/"
            target="_blank"
          >
            Documentation
          </a>
        </li>

        <li>
          <a href="https://matsn0w.dev" target="_blank">matsn0w.dev</a>
        </li>

        <li>
          <a href="https://github.com/JustinRijsdijk" target="_blank"
            >Justin Rijsdijk</a
          >
        </li>
      </ul>
    </footer>
  </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();

const year = new Date().getFullYear();
const version = runtimeConfig.public.version;
</script>

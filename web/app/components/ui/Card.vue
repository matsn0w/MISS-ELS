<template>
  <section
    class="my-6 scroll-mt-4 rounded-md bg-white p-2 shadow-lg dark:bg-gray-800"
  >
    <header
      v-if="title || $slots.actions"
      class="flex flex-wrap items-center gap-4 px-3 pt-3 md:px-5"
    >
      <h2 v-if="title" class="font-semibold text-gray-800 dark:text-gray-300">
        {{ title }}
      </h2>
      <slot name="actions" />
    </header>

    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>();
</script>

<template>
  <div class="mb-3 md:flex md:items-center">
    <label
      :for="inputId"
      class="mb-1 block shrink-0 pr-4 font-semibold text-gray-500 md:mb-0 md:text-right dark:text-gray-300"
    >
      {{ label }}
    </label>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; inputId?: string }>();
</script>

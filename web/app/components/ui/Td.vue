<template>
  <td
    :data-label="label"
    class="p-2 align-middle max-md:block max-md:p-1"
    :class="
      label &&
      'max-md:before:mb-1 max-md:before:block max-md:before:text-xs max-md:before:font-semibold max-md:before:uppercase max-md:before:text-gray-400 max-md:before:content-[attr(data-label)]'
    "
  >
    <slot />
  </td>
</template>

<script setup lang="ts">
defineProps<{ label?: string }>();
</script>

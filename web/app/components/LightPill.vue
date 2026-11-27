<template>
  <component
    :is="clickable ? 'button' : 'span'"
    :type="clickable ? 'button' : undefined"
    class="mr-3 inline-flex min-w-[2.25rem] select-none items-center justify-center rounded-sm border-2 px-3 py-2 text-center transition-colors"
    :class="[
      active
        ? getLightColorClasses(color)
        : 'border-gray-300 bg-gray-200 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300',
      clickable && 'cursor-pointer hover:border-blue-400',
    ]"
  >
    {{ label }}
  </component>
</template>

<script setup lang="ts">
import type { Color } from "~/types/lights";
import { getLightColorClasses } from "~/utils/uiClasses";

defineProps<{
  label: string | number;
  color?: Color | null;
  active?: boolean;
  clickable?: boolean;
}>();
</script>

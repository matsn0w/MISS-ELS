<template>
  <select
    v-model="model"
    :class="[
      fieldClasses(surface),
      'form-select bg-(image:--select-chevron) pr-10 disabled:cursor-not-allowed disabled:opacity-60',
      // the option list is drawn by the browser; give it the theme's colors
      'dark:[&_option]:bg-gray-800 dark:[&_option]:text-gray-100',
    ]"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
import { fieldClasses } from "~/utils/uiClasses";

const props = withDefaults(
  defineProps<{ modelValue?: unknown; surface?: "card" | "page" }>(),
  { modelValue: undefined, surface: "card" },
);
const emit = defineEmits<{ "update:modelValue": [value: unknown] }>();

// a computed v-model keeps the original option value types (numbers stay numbers)
const model = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    class="group inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-blue-400"
      :class="modelValue ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
    >
      <span
        class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
        :class="modelValue && 'translate-x-4'"
      />
    </span>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>

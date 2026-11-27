<template>
  <label
    class="inline-flex cursor-pointer select-none items-center gap-2 align-middle font-semibold text-gray-500 dark:text-gray-300"
  >
    <input
      :checked="modelValue"
      type="checkbox"
      class="form-checkbox h-5 w-5 rounded-sm border-gray-100 bg-gray-100 text-blue-500 focus:ring-blue-500 dark:border-gray-900 dark:bg-gray-900 dark:checked:bg-blue-500"
      @change="
        emit('update:modelValue', ($event.target as HTMLInputElement).checked)
      "
    />
    <slot />
  </label>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>

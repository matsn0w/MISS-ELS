<template>
  <input
    :value="modelValue"
    :type="type"
    :class="[fieldClasses(surface), 'form-input']"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { fieldClasses } from "~/utils/uiClasses";

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    type?: "text" | "number";
    surface?: "card" | "page";
  }>(),
  { modelValue: null, type: "text", surface: "card" },
);

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
}>();

const onInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;

  if (props.type === "number") {
    emit("update:modelValue", value === "" ? null : Number(value));
  } else {
    emit("update:modelValue", value);
  }
};
</script>

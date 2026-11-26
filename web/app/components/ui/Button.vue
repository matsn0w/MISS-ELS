<template>
  <button :type="type" :class="classes">
    <slot />
  </button>
</template>

<script setup lang="ts">
export type ButtonVariant = "blue" | "amber" | "red" | "green" | "gray";
export type ButtonSize = "xs" | "sm" | "md" | "icon";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    outlined?: boolean;
    size?: ButtonSize;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "blue",
    outlined: false,
    size: "sm",
    type: "button",
  },
);

const solid: Record<ButtonVariant, string> = {
  blue: "border-blue-500 bg-blue-500 text-white enabled:hover:bg-blue-600 enabled:hover:border-blue-600",
  amber:
    "border-yellow-500 bg-yellow-500 text-white enabled:hover:bg-yellow-600 enabled:hover:border-yellow-600",
  red: "border-red-500 bg-red-500 text-white enabled:hover:bg-red-600 enabled:hover:border-red-600",
  green:
    "border-green-500 bg-green-500 text-white enabled:hover:bg-green-600 enabled:hover:border-green-600",
  gray: "border-gray-500 bg-gray-500 text-white enabled:hover:bg-gray-600 enabled:hover:border-gray-600",
};

const outline: Record<ButtonVariant, string> = {
  blue: "border-blue-500 bg-transparent text-blue-500 enabled:hover:bg-blue-500 enabled:hover:text-white",
  amber:
    "border-yellow-500 bg-transparent text-yellow-500 enabled:hover:bg-yellow-500 enabled:hover:text-white",
  red: "border-red-500 bg-transparent text-red-500 enabled:hover:bg-red-500 enabled:hover:text-white",
  green:
    "border-green-500 bg-transparent text-green-500 enabled:hover:bg-green-500 enabled:hover:text-white",
  gray: "border-gray-500 bg-transparent text-gray-500 enabled:hover:bg-gray-500 enabled:hover:text-white",
};

const sizes: Record<ButtonSize, string> = {
  xs: "px-1.5 py-1",
  sm: "px-2 py-1",
  md: "px-4 py-2",
  icon: "p-3",
};

const classes = computed(() => [
  "inline-flex items-center justify-center gap-2 rounded-sm border text-sm shadow-sm transition-colors",
  "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900",
  "disabled:cursor-not-allowed disabled:opacity-50",
  props.outlined ? outline[props.variant] : solid[props.variant],
  sizes[props.size],
]);
</script>

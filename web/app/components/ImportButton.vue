<template>
  <UiButton outlined size="md" @click="fileInput?.click()">
    Import Existing VCF
  </UiButton>

  <input
    ref="fileInput"
    class="hidden"
    type="file"
    accept=".xml,text/xml,application/xml"
    @change="loadVCF"
  />
</template>

<script setup lang="ts">
const fileInput = ref<HTMLInputElement | null>(null);

const emit = defineEmits<{ load: [contents: string] }>();

const loadVCF = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => emit("load", reader.result as string);
  reader.readAsText(file);

  // allow importing the same file again
  input.value = "";
};
</script>

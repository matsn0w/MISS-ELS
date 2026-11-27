<template>
  <UiCard title="Stages">
    <template #actions>
      <UiButton :disabled="stages.length >= MAX_STAGES" @click="useAddStage">
        <PlusIcon class="h-4 w-4" />
        Add stage
      </UiButton>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ stages.length }} / {{ MAX_STAGES }}
      </span>
    </template>

    <p class="px-3 pt-1 text-sm text-gray-500 md:px-5 dark:text-gray-400">
      Each stage is toggled with its own key. Stages 1–3 use Q, K and L by
      default; for stages 4–10 players pick a key in the FiveM key bindings. In
      a pattern, each column is a flash whose width follows its duration.
    </p>

    <StageEditor
      v-for="(stage, index) in stages"
      :key="stage.id"
      :index="index"
    />

    <p
      v-if="!stages.length"
      class="px-3 py-4 text-sm italic text-gray-500 md:px-5 dark:text-gray-400"
    >
      No stages yet. Add one to start building light patterns.
    </p>
  </UiCard>
</template>

<script setup lang="ts">
import { PlusIcon } from "@heroicons/vue/24/solid";

const VCF = useVcfConfiguration();
const stages = computed(() => VCF.value.configuration.stages);
</script>

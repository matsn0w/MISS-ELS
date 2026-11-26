<template>
  <div
    class="mt-4 border-t border-gray-100 px-3 pt-4 first:border-t-0 md:px-5 dark:border-gray-700"
    role="group"
    data-tour="stage"
    :aria-label="`Stage ${index + 1}`"
  >
    <!-- stage identity and actions -->
    <header class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <h3 class="font-bold text-gray-800 dark:text-gray-300">
        Stage {{ index + 1 }}
      </h3>
      <div class="w-44">
        <UiInput
          v-model="stage.name"
          :aria-label="`Name of stage ${index + 1}`"
          placeholder="Name"
          class="text-sm"
        />
      </div>
      <span
        class="rounded-full px-2 py-0.5 text-xs font-semibold"
        :class="
          key
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
        "
        :title="
          key
            ? `Players toggle this stage with ${key} by default`
            : 'Players assign a key in the FiveM key bindings'
        "
      >
        {{ key ? `Key ${key}` : "No default key" }}
      </span>

      <div class="ml-auto flex items-center gap-2">
        <label
          :for="`copy_stage_${stage.id}`"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          Copy from
        </label>
        <div class="w-32">
          <UiSelect
            :id="`copy_stage_${stage.id}`"
            :model-value="''"
            @update:model-value="copyFrom($event as string)"
          >
            <option value="" disabled>Stage...</option>
            <option
              v-for="(other, otherIndex) in stages"
              v-show="other !== stage"
              :key="other.id"
              :value="String(other.id)"
              :disabled="other === stage"
            >
              {{ otherIndex + 1 }}{{ other.name ? ` · ${other.name}` : "" }}
            </option>
          </UiSelect>
        </div>
        <UiButton
          size="xs"
          variant="gray"
          outlined
          title="Move up"
          :disabled="index === 0"
          @click="useMoveStage(stage, stages[index - 1])"
        >
          <ChevronUpIcon class="h-4 w-4" />
          <span class="sr-only">Move stage {{ index + 1 }} up</span>
        </UiButton>
        <UiButton
          size="xs"
          variant="gray"
          outlined
          title="Move down"
          :disabled="index === stages.length - 1"
          @click="useMoveStage(stage, stages[index + 1])"
        >
          <ChevronDownIcon class="h-4 w-4" />
          <span class="sr-only">Move stage {{ index + 1 }} down</span>
        </UiButton>
        <UiButton
          size="xs"
          variant="red"
          outlined
          title="Remove stage"
          @click="removeStage"
        >
          <TrashIcon class="h-4 w-4" />
          <span class="sr-only">Remove stage {{ index + 1 }}</span>
        </UiButton>
      </div>
    </header>

    <!-- options and preview controls -->
    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <UiCheckbox v-model="stage.isEmergency">Is emergency</UiCheckbox>
      <UiCheckbox v-model="stage.flashHighBeam">Flash high beam</UiCheckbox>
      <UiCheckbox v-model="stage.enableWarningBeep">
        Enable warning beep
      </UiCheckbox>

      <div
        class="ml-auto flex items-center gap-3"
        role="group"
        :aria-label="`Stage ${index + 1} preview`"
      >
        <UiButton
          v-if="!isPlaying"
          variant="green"
          outlined
          :disabled="!hasFlashes && !hasSteadyLights"
          @click="play"
        >
          <PlayIcon class="h-4 w-4" />
          Preview
        </UiButton>
        <UiButton v-else variant="amber" @click="stop">
          <StopIcon class="h-4 w-4" />
          Stop
        </UiButton>
        <UiSwitch v-model="stage.loopPreview">Loop</UiSwitch>
      </div>
    </div>

    <p
      v-if="!lights.length"
      class="py-4 text-sm italic text-gray-500 dark:text-gray-400"
    >
      Add lightables (that are not static) to start building this stage.
    </p>

    <template v-else>
      <!-- preview: a display of the lights only -->
      <div
        class="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-900/50"
      >
        <div class="flex flex-wrap gap-y-2">
          <LightPill
            v-for="light in lights"
            :key="`${light.type}_${light.id}`"
            :label="lightLabel(light)"
            :color="light.color"
            :active="isPlaying && isLit(light)"
          />
        </div>
        <p class="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {{ stage.patterns.length }}
          pattern{{ stage.patterns.length === 1 ? "" : "s" }}
          <template v-if="stage.patterns.length > 1">
            running at the same time
          </template>
        </p>
      </div>

      <!-- lights that stay on for the whole stage -->
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">
          On for the whole stage
        </span>
        <!-- toggle chips, deliberately unlike the square preview lights -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="light in lights"
            :key="`${light.type}_${light.id}`"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors"
            :class="
              hasLight(stage, light)
                ? getLightColorClasses(light.color)
                : 'border-gray-300 bg-transparent text-gray-600 hover:border-blue-400 dark:border-gray-600 dark:text-gray-300'
            "
            :aria-pressed="hasLight(stage, light)"
            :aria-label="`Keep ${light.type} ${light.id} on for stage ${index + 1}`"
            @click="useToggleStageLight(stage, light)"
          >
            <CheckIcon v-if="hasLight(stage, light)" class="h-3.5 w-3.5" />
            <span
              v-else
              class="h-2.5 w-2.5 rounded-full border"
              :class="getLightColorClasses(light.color)"
            />
            {{ lightLabel(light) }}
          </button>
        </div>
      </div>

      <PatternTimeline
        v-for="(pattern, patternIndex) in stage.patterns"
        :key="pattern.id"
        :stage-index="index"
        :pattern-index="patternIndex"
        :lights="lights"
        :active-flash-id="activeFlashes[pattern.id] ?? null"
      />

      <div class="mt-3 flex flex-wrap items-center gap-3">
        <UiButton outlined @click="useAddPattern(stage)">
          <PlusIcon class="h-4 w-4" />
          Add pattern
        </UiButton>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          Patterns in a stage run at the same time, e.g. the front and the rear
          lights.
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlayIcon,
  PlusIcon,
  StopIcon,
  TrashIcon,
} from "@heroicons/vue/24/solid";
import type { flashType } from "~/types/flash";
import type { Lightable } from "~/types/lights";
import type { Stage, StagePattern } from "~/types/stages";
import { getLightColorClasses } from "~/utils/uiClasses";

const props = defineProps<{ index: number }>();

const VCF = useVcfConfiguration();
const stages = computed(() => VCF.value.configuration.stages);

// read the stage from the shared configuration (instead of mutating a prop)
const stage = computed(() => stages.value[props.index] as Stage);
const key = computed(() => stageKey(props.index + 1));

const lights = computed(() => [
  ...enabledLightables("extra"),
  ...enabledLightables("misc"),
]);

const enabledLightables = (type: Lightable["type"]) =>
  VCF.value.configuration.lightables.filter(
    (lightable) =>
      lightable.enabled &&
      lightable.type === type &&
      lightableIsNotInUseAsStatic(lightable.id),
  );

const hasFlashes = computed(() =>
  stage.value.patterns.some((pattern) => pattern.flashes.length),
);
const hasSteadyLights = computed(
  () => stage.value.extras.length + stage.value.miscs.length > 0,
);

const copyFrom = (sourceId: string) => {
  const source = stages.value.find((s) => String(s.id) === sourceId);
  if (!source) return;

  const isEmpty = !hasFlashes.value && !hasSteadyLights.value;
  if (
    isEmpty ||
    window.confirm(
      `Replace the lights and patterns of stage ${props.index + 1} with those of stage ${stages.value.indexOf(source) + 1}?`,
    )
  ) {
    useCopyStage(source, stage.value);
  }
};

const removeStage = () => {
  const isEmpty = !hasFlashes.value && !hasSteadyLights.value;
  if (
    isEmpty ||
    window.confirm(`Remove stage ${props.index + 1} and all of its patterns?`)
  ) {
    stop();
    useRemoveStage(stage.value);
  }
};

// preview: every pattern loops on its own, all at the same time;
// each run gets an id so a stopped run never overlaps a new one
const activeFlashes = ref<Record<number, number | null>>({});
const isPlaying = ref(false);
let run = 0;

const isLit = (light: Lightable) =>
  hasLight(stage.value, light) ||
  stage.value.patterns.some((pattern) => {
    const flash = pattern.flashes.find(
      (f) => f.id === activeFlashes.value[pattern.id],
    );
    return flash ? hasLight(flash, light) : false;
  });

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const playPattern = async (pattern: StagePattern, isActive: () => boolean) => {
  do {
    if (!pattern.flashes.length) return;

    for (const flash of [...pattern.flashes] as flashType[]) {
      if (!isActive()) return;
      activeFlashes.value[pattern.id] = flash.id;
      await wait(flash.duration || 0);
    }
  } while (stage.value.loopPreview && isActive());

  if (isActive()) activeFlashes.value[pattern.id] = null;
};

const play = async () => {
  const current = ++run;
  const isActive = () => isPlaying.value && run === current;
  isPlaying.value = true;

  if (hasFlashes.value) {
    await Promise.all(
      stage.value.patterns.map((pattern) => playPattern(pattern, isActive)),
    );
  } else if (stage.value.loopPreview) {
    // only always-on lights: they stay on until the preview is stopped
    return;
  } else {
    await wait(1000);
  }

  if (run === current) stop();
};

const stop = () => {
  run++;
  isPlaying.value = false;
  activeFlashes.value = {};
};

onBeforeUnmount(stop);
</script>

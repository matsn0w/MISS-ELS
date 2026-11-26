<template>
  <div class="mt-4" :aria-label="`Pattern ${patternIndex + 1}`" role="group">
    <header class="flex flex-wrap items-center gap-3">
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Pattern {{ patternIndex + 1 }}
      </h4>
      <p class="text-xs tabular-nums text-gray-500 dark:text-gray-400">
        <template v-if="activeIndex !== -1">
          Flash {{ activeIndex + 1 }} / {{ pattern.flashes.length }} ·
        </template>
        <template v-else>
          {{ pattern.flashes.length }}
          flash{{ pattern.flashes.length === 1 ? "" : "es" }} ·
        </template>
        cycle {{ cycleDuration }} ms
      </p>
      <UiButton
        class="ml-auto"
        size="xs"
        variant="red"
        outlined
        @click="removePattern"
      >
        <XMarkIcon class="h-3 w-3" />
        Remove pattern
      </UiButton>
    </header>

    <div
      v-if="!pattern.flashes.length"
      class="mt-2 flex flex-wrap items-center gap-3 rounded-md border-2 border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
    >
      No flashes yet.
      <UiButton @click="useAddFlash(pattern)">
        <PlusIcon class="h-4 w-4" />
        Add flash
      </UiButton>
    </div>

    <div v-else class="relative mt-2 overflow-x-auto pb-2">
      <div class="flex w-max min-w-full">
        <!-- light labels -->
        <div
          class="sticky left-0 z-10 flex w-16 shrink-0 flex-col bg-white pr-2 dark:bg-gray-800"
        >
          <div
            class="flex h-24 items-end pb-1 text-xs font-semibold uppercase text-gray-400"
          >
            Light
          </div>
          <div
            v-for="light in lights"
            :key="`${light.type}_${light.id}`"
            class="flex h-9 items-center gap-1 text-sm font-semibold text-gray-600 dark:text-gray-300"
          >
            <span
              class="h-2.5 w-2.5 rounded-full border"
              :class="getLightColorClasses(light.color)"
            />
            {{ lightLabel(light) }}
          </div>
        </div>

        <!-- flashes -->
        <div
          v-for="(flash, flashIndex) in pattern.flashes"
          :key="flash.id"
          class="flex shrink-0 flex-col rounded-md border-2 px-1 transition-colors"
          :class="[
            activeFlashId === flash.id
              ? 'border-blue-400'
              : 'border-transparent',
            dropTargetId === flash.id && 'bg-blue-50 dark:bg-blue-950',
          ]"
          :style="{ width: `${columnWidth(flash)}px` }"
          @dragover.prevent="dropTargetId = flash.id"
          @dragleave="dropTargetId === flash.id && (dropTargetId = null)"
          @drop.prevent="onDrop(flash)"
        >
          <div class="flex h-24 flex-col justify-end gap-1 pb-1">
            <div
              class="flex cursor-grab items-center justify-between text-xs font-semibold text-gray-400 active:cursor-grabbing"
              draggable="true"
              title="Drag to reorder"
              @dragstart="onDragStart($event, flash)"
              @dragend="draggedId = dropTargetId = null"
            >
              <span>#{{ flashIndex + 1 }}</span>
              <Bars3Icon class="h-4 w-4" />
            </div>
            <UiInput
              v-model="flash.duration"
              type="number"
              min="0"
              step="10"
              class="px-1! text-sm"
              :aria-label="`Duration of flash ${flashIndex + 1} in ms`"
            />
            <div class="flex justify-between">
              <UiButton
                size="xs"
                variant="gray"
                outlined
                title="Move left"
                :disabled="flashIndex === 0"
                @click="
                  useMoveFlash(pattern, flash, pattern.flashes[flashIndex - 1])
                "
              >
                <ChevronLeftIcon class="h-3 w-3" />
                <span class="sr-only">
                  Move flash {{ flashIndex + 1 }} left
                </span>
              </UiButton>
              <UiButton
                size="xs"
                variant="gray"
                outlined
                title="Duplicate"
                @click="useDuplicateFlash(pattern, flash)"
              >
                <DocumentDuplicateIcon class="h-3 w-3" />
                <span class="sr-only">
                  Duplicate flash {{ flashIndex + 1 }}
                </span>
              </UiButton>
              <UiButton
                size="xs"
                variant="red"
                outlined
                title="Remove"
                @click="useRemoveFlash(pattern, flash)"
              >
                <XMarkIcon class="h-3 w-3" />
                <span class="sr-only">Remove flash {{ flashIndex + 1 }}</span>
              </UiButton>
            </div>
          </div>

          <div
            v-for="light in lights"
            :key="`${light.type}_${light.id}`"
            class="flex h-9 items-center"
          >
            <!-- lights that stay on for the whole stage can't flash -->
            <button
              v-if="hasLight(stage, light)"
              type="button"
              disabled
              class="h-7 w-full cursor-not-allowed rounded-sm border-2 opacity-40"
              :class="getLightColorClasses(light.color)"
              title="On for the whole stage"
              :aria-label="`${light.type} ${light.id} in flash ${flashIndex + 1} (on for the whole stage)`"
            />
            <button
              v-else
              type="button"
              class="h-7 w-full rounded-sm border-2 transition-colors"
              :class="
                hasLight(flash, light)
                  ? getLightColorClasses(light.color)
                  : 'border-gray-200 bg-gray-100 hover:border-blue-400 dark:border-gray-700 dark:bg-gray-900'
              "
              :aria-pressed="hasLight(flash, light)"
              :aria-label="`${light.type} ${light.id} in flash ${flashIndex + 1}`"
              @click="useToggleLight(flash, light)"
            />
          </div>
        </div>

        <!-- add flash -->
        <div class="flex shrink-0 flex-col pl-1">
          <div class="h-24" />
          <button
            type="button"
            class="flex w-20 flex-1 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 text-xs font-semibold text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:border-gray-600"
            @click="useAddFlash(pattern)"
          >
            <PlusIcon class="h-5 w-5" />
            Add flash
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Bars3Icon,
  ChevronLeftIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/vue/24/solid";
import type { flashType } from "~/types/flash";
import type { Lightable } from "~/types/lights";
import type { Stage, StagePattern } from "~/types/stages";
import { getLightColorClasses } from "~/utils/uiClasses";

const props = defineProps<{
  stageIndex: number;
  patternIndex: number;
  lights: Lightable[];
  /** the flash shown by the preview right now */
  activeFlashId: number | null;
}>();

const VCF = useVcfConfiguration();

// read from the shared configuration instead of mutating props
const stage = computed(
  () => VCF.value.configuration.stages[props.stageIndex] as Stage,
);
const pattern = computed(
  () => stage.value.patterns[props.patternIndex] as StagePattern,
);

const activeIndex = computed(() =>
  pattern.value.flashes.findIndex((f) => f.id === props.activeFlashId),
);

const cycleDuration = computed(() =>
  pattern.value.flashes.reduce((total, f) => total + (f.duration || 0), 0),
);

// a column's width follows its duration, so the timeline reads like time
const columnWidth = (flash: flashType) =>
  Math.min(320, Math.max(104, (flash.duration || 0) * 0.6));

const removePattern = () => {
  if (
    !pattern.value.flashes.length ||
    window.confirm(
      `Remove pattern ${props.patternIndex + 1} and its ${pattern.value.flashes.length} flash(es)?`,
    )
  ) {
    useRemovePattern(stage.value, pattern.value);
  }
};

// drag & drop reordering
const draggedId = ref<number | null>(null);
const dropTargetId = ref<number | null>(null);

const onDragStart = (event: DragEvent, flash: flashType) => {
  draggedId.value = flash.id;
  event.dataTransfer?.setData("text/plain", String(flash.id));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
};

const onDrop = (target: flashType) => {
  const dragged = pattern.value.flashes.find((f) => f.id === draggedId.value);
  if (dragged) useMoveFlash(pattern.value, dragged, target);
  draggedId.value = dropTargetId.value = null;
};
</script>

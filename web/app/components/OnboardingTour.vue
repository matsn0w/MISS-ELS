<template>
  <Teleport to="body">
    <div
      v-if="open && step"
      class="fixed inset-0 z-50"
      @keydown.esc.prevent="skip"
      @keydown.right.prevent="next"
      @keydown.left.prevent="back"
    >
      <!-- the dimmed page, with a hole around the explained element -->
      <div
        v-if="spotlight"
        class="pointer-events-none fixed rounded-lg ring-2 ring-blue-400 transition-all duration-300"
        :style="{
          top: `${spotlight.top}px`,
          left: `${spotlight.left}px`,
          width: `${spotlight.width}px`,
          height: `${spotlight.height}px`,
          boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.55)',
        }"
      />
      <div v-else class="fixed inset-0 bg-black/55" />

      <!-- clicks outside the card do nothing, so the tour can't be lost -->
      <div class="fixed inset-0" aria-hidden="true" />

      <div
        ref="card"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`tour-title`"
        :aria-describedby="`tour-body`"
        tabindex="-1"
        class="fixed z-10 w-[min(26rem,calc(100vw-2rem))] rounded-lg bg-white p-5 shadow-2xl outline-none dark:bg-gray-800"
        :style="cardStyle"
        @keydown.tab="trapFocus"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400"
        >
          Step {{ index + 1 }} of {{ steps.length }}
        </p>
        <h2
          id="tour-title"
          class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100"
        >
          {{ step.title }}
        </h2>
        <div
          id="tour-body"
          class="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300"
        >
          <p v-for="(paragraph, i) in step.body" :key="i">{{ paragraph }}</p>
        </div>

        <!-- a mini timeline: columns are flashes, their width is the duration -->
        <div
          v-if="step.illustration === 'timeline'"
          class="mt-3 rounded-md bg-gray-50 p-3 dark:bg-gray-900"
          aria-hidden="true"
        >
          <div class="flex gap-1 text-[10px] font-semibold text-gray-400">
            <span class="w-6">ms</span>
            <span
              v-for="(flash, i) in exampleFlashes"
              :key="i"
              class="text-center"
              :style="{ width: `${flash.width}px` }"
            >
              {{ flash.ms }}
            </span>
          </div>
          <div
            v-for="(row, r) in exampleLights"
            :key="r"
            class="mt-1 flex items-center gap-1"
          >
            <span class="w-6 text-[10px] font-semibold text-gray-500">
              {{ row.label }}
            </span>
            <span
              v-for="(flash, i) in exampleFlashes"
              :key="i"
              class="h-4 rounded-sm"
              :class="
                row.on.includes(i) ? row.color : 'bg-gray-200 dark:bg-gray-700'
              "
              :style="{ width: `${flash.width}px` }"
            />
          </div>
        </div>

        <!-- progress -->
        <div class="mt-4 flex gap-1" aria-hidden="true">
          <span
            v-for="(_, i) in steps"
            :key="i"
            class="h-1.5 flex-1 rounded-full"
            :class="i <= index ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'"
          />
        </div>

        <div class="mt-4 flex items-center gap-2">
          <button
            type="button"
            class="text-sm text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
            @click="skip"
          >
            {{ isLast ? "Close" : "Skip tour" }}
          </button>
          <div class="ml-auto flex gap-2">
            <UiButton
              v-if="index > 0"
              variant="gray"
              outlined
              size="md"
              @click="back"
            >
              Back
            </UiButton>
            <UiButton size="md" @click="next">
              {{ isFirst ? "Start the tour" : isLast ? "Finish" : "Next" }}
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
type TourStep = {
  title: string;
  body: string[];
  /** CSS selector of the element to highlight; none for a centered card */
  target?: string;
  /** a small drawing in the card, for steps that are easier to show */
  illustration?: "timeline";
};

const steps: TourStep[] = [
  {
    title: "Welcome to the VCF Configurator",
    body: [
      "A VCF (vehicle configuration file) tells MISS-ELS which lights a vehicle has, how they flash and which sirens it uses.",
      "This short tour shows you around. You can skip it now and restart it any time with the Tour button at the top.",
    ],
  },
  {
    title: "Start or import",
    target: '[data-tour="toolbar"]',
    body: [
      "Import an existing VCF to edit it; files in the old MISS-ELS 2 format are converted to stages for you.",
      "Your work is saved in this browser, so you can continue later. Turn off Save in browser to start fresh on every visit.",
    ],
  },
  {
    title: "About this VCF",
    target: "#general",
    body: [
      "The description also becomes the file name. Output format decides how the file is written: MISS-ELS 3 stages, or the old MISS-ELS 2 format for servers that are not on version 3 yet.",
    ],
  },
  {
    title: "Lightables",
    target: "#lightables",
    body: [
      "Add every extra and misc of the vehicle that MISS-ELS should control. Only lights listed here can be used in stages.",
      "Allow env light makes a light glow on its surroundings; pick the color it should glow in.",
    ],
  },
  {
    title: "Statics",
    target: "#statics",
    body: [
      "Statics are lights players switch on and off themselves from the statics menu (U), such as a takedown light. They don't flash in stages.",
    ],
  },
  {
    title: "Sounds",
    target: "#sounds",
    body: [
      "Choose which horn and siren tones the vehicle may use and which sounds they play. Using WMServerSirens? Tick it to fill in its sound names.",
    ],
  },
  {
    title: "Light stages",
    target: "#stages",
    body: [
      "A stage is what a player switches on with one key: stages 1 to 3 are on Q, K and L, and players can bind stages 4 to 10 themselves.",
      "Each stage has lights that can stay on for the whole stage, and one or more patterns that run at the same time, e.g. one for the front and one for the rear.",
    ],
  },
  {
    title: "Patterns and flashes",
    target: '[data-tour="stage"]',
    illustration: "timeline",
    body: [
      "In a pattern, every column is a flash: its width follows its duration. Click a cell to switch a light on or off in that flash, and drag a column's header to reorder it.",
      "Press Preview to watch the whole stage, all patterns together.",
    ],
  },
  {
    title: "Check and export",
    target: '[data-tour="actions"]',
    body: [
      "Warnings point out likely mistakes, and Preview XML shows the file as it will be saved. Generate VCF downloads it.",
      "Put the file in the xmlFiles folder of the resource. That's it, have fun!",
    ],
  },
];

// the illustrated timeline: flashes (width follows the duration) and which
// lights are on in them
const exampleFlashes = [100, 100, 200, 300].map((ms) => ({
  ms,
  width: ms * 0.24,
}));
const exampleLights = [
  { label: "E1", color: "bg-red-500", on: [0, 2] },
  { label: "E2", color: "bg-blue-500", on: [1, 2] },
];

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [completed: boolean] }>();

const index = ref(0);
const step = computed(() => steps[index.value]);
const isFirst = computed(() => index.value === 0);
const isLast = computed(() => index.value === steps.length - 1);

const card = ref<HTMLElement | null>(null);
const spotlight = ref<{
  top: number;
  left: number;
  width: number;
  height: number;
} | null>(null);
const cardPosition = ref<{ top: number; left: number } | null>(null);

const targetElement = () =>
  step.value?.target
    ? (document.querySelector<HTMLElement>(step.value.target) ?? null)
    : null;

const PADDING = 8;
const GAP = 12;

/** Highlights the target and places the card next to it, inside the screen. */
const measure = () => {
  const target = targetElement();
  if (!target || !card.value) {
    spotlight.value = null;
    cardPosition.value = null;
    return;
  }

  const rect = target.getBoundingClientRect();
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  spotlight.value = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };

  const cardRect = card.value.getBoundingClientRect();
  const below = rect.bottom + PADDING + GAP;
  const above = rect.top - PADDING - GAP - cardRect.height;

  let top: number;
  if (below + cardRect.height <= viewport.height - GAP) top = below;
  else if (above >= GAP) top = above;
  // the target fills the screen: keep the card at the bottom of the screen
  else top = viewport.height - cardRect.height - GAP;

  const left = Math.min(
    Math.max(GAP, rect.left),
    viewport.width - cardRect.width - GAP,
  );
  cardPosition.value = { top, left };
};

const cardStyle = computed(() =>
  cardPosition.value
    ? {
        top: `${cardPosition.value.top}px`,
        left: `${cardPosition.value.left}px`,
      }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
);

const showStep = async () => {
  await nextTick();
  const target = targetElement();

  // put the target at the top of the screen, so the card fits below it
  // (fixed elements, like the action bar, are always in view)
  if (target && getComputedStyle(target).position !== "fixed") {
    const top = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top - 24) });
  }

  await nextTick();
  measure();
  card.value?.focus();
};

const next = () => {
  if (isLast.value) {
    finish(true);
    return;
  }
  index.value++;
};

const back = () => {
  if (index.value > 0) index.value--;
};

const skip = () => finish(isLast.value);

const finish = (completed: boolean) => emit("close", completed);

/** Keeps keyboard focus inside the card while the tour is open. */
const trapFocus = (event: KeyboardEvent) => {
  const focusable = card.value?.querySelectorAll<HTMLElement>("button");
  if (!focusable?.length) return;

  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

watch(index, showStep);
watch(
  () => props.open,
  (open) => {
    if (open) {
      index.value = 0;
      showStep();
    }
  },
  { immediate: true },
);

// keep the spotlight on its target while scrolling or resizing
let frame = 0;
const onViewportChange = () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(measure);
};

onMounted(() => {
  window.addEventListener("scroll", onViewportChange, { passive: true });
  window.addEventListener("resize", onViewportChange);
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onViewportChange);
  window.removeEventListener("resize", onViewportChange);
  cancelAnimationFrame(frame);
});
</script>

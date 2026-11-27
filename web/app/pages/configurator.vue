<template>
  <div>
    <header class="my-4 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-300">
        MISS ELS VCF Configurator
      </h1>

      <div
        class="flex flex-wrap items-center gap-x-6 gap-y-3"
        data-tour="toolbar"
      >
        <div
          class="inline-flex rounded-md border border-gray-300 p-0.5 dark:border-gray-600"
          role="radiogroup"
          aria-label="Editor mode"
          data-tour="mode"
        >
          <button
            v-for="option in modeOptions"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="editorMode === option.value"
            :title="option.title"
            class="rounded-sm px-3 py-1 text-sm font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400"
            :class="
              editorMode === option.value
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            "
            @click="editorMode = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <UiSwitch v-model="isDark">Dark mode</UiSwitch>
        <UiSwitch
          :model-value="saveInBrowser"
          @update:model-value="setSaveInBrowser"
        >
          Save in browser
        </UiSwitch>
        <ImportButton @load="importVcf" />
        <UiButton
          variant="gray"
          outlined
          size="md"
          title="Show the step-by-step tour again"
          @click="tourOpen = true"
        >
          <AcademicCapIcon class="h-4 w-4" />
          Tour
        </UiButton>
      </div>
    </header>

    <div
      v-if="!hasReadLocalStorageNotice"
      class="flex items-start gap-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800"
    >
      <InformationCircleIcon class="h-5 w-5 shrink-0 text-yellow-500" />
      <p class="flex-1">
        Your VCF is saved in this browser, so you can pick up where you left
        off. Turn off <strong>Save in browser</strong> at the top to start fresh
        each visit.
      </p>
      <button
        type="button"
        class="shrink-0 rounded-sm p-0.5 hover:bg-yellow-100"
        @click="dismissLocalStorageNotice"
      >
        <XMarkIcon class="h-5 w-5" />
        <span class="sr-only">Dismiss</span>
      </button>
    </div>

    <form @submit.prevent="generateVCF">
      <section id="general" class="mt-6 scroll-mt-4">
        <UiFormRow label="Description" input-id="description">
          <UiInput
            id="description"
            v-model="VCF.configuration.description"
            surface="page"
            placeholder="e.g. police-car"
          />
        </UiFormRow>

        <UiFormRow label="Author" input-id="author">
          <UiInput
            id="author"
            v-model="VCF.configuration.author"
            surface="page"
          />
        </UiFormRow>

        <UiFormRow
          v-if="isAdvanced || outputFormat === 'legacy'"
          label="Output format"
          input-id="output-format"
        >
          <div class="w-full">
            <UiSelect id="output-format" v-model="outputFormat" surface="page">
              <option value="stages">MISS-ELS 3: stages</option>
              <option value="legacy">MISS-ELS 2: PATTERN (legacy)</option>
            </UiSelect>
            <p
              v-if="outputFormat === 'legacy' && legacyProblems.length"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              This VCF uses stage features the old format can't hold:
              {{ legacyProblems.join(" ") }}
            </p>
          </div>
        </UiFormRow>

        <div
          v-if="convertedFromLegacy"
          class="mb-3 flex items-start gap-3 rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200"
          role="status"
        >
          <ArrowPathIcon class="h-5 w-5 shrink-0" />
          <p class="flex-1">
            Converted from the MISS-ELS 2 format: PRIMARY became stage 1 (Q),
            REARREDS stage 2 (K) and SECONDARY stage 3 (L). Generate the VCF to
            save it as stages, or pick the MISS-ELS 2 output format to keep the
            old format.
          </p>
          <button
            type="button"
            class="shrink-0 rounded-sm p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900"
            @click="convertedFromLegacy = false"
          >
            <XMarkIcon class="h-5 w-5" />
            <span class="sr-only">Dismiss conversion notice</span>
          </button>
        </div>

        <UiFormRow v-if="isAdvanced" label="VCF schema version">
          <p class="text-gray-500 dark:text-gray-300">
            {{ VCF.configuration.version ?? "Unknown" }}
          </p>
        </UiFormRow>

        <div
          v-if="!isVcfSchemaVersionUpToDate"
          class="flex gap-3 border-l-4 border-yellow-400 bg-yellow-50 p-4"
        >
          <ExclamationTriangleIcon class="h-5 w-5 shrink-0 text-yellow-400" />
          <p class="text-sm text-yellow-700">
            Please be aware! The VCF you have imported was generated with an
            older version of the configurator.
            <br />
            This means that some settings may not be available in the
            configurator, or have been enabled, disabled or changed by default.
            <br />
            Your VCF schema version is
            <span class="font-medium">
              {{ VCF.configuration.version ?? "Unknown" }}</span>, the latest
            version is
            <span class="font-medium">{{ config.public.version }}</span>.
          </p>
        </div>
      </section>

      <LightablesSection id="lightables" />
      <StaticsSection id="statics" />
      <SoundsSection id="sounds" />
      <StagesSection id="stages" />

      <!-- action bar, fixed to the bottom of the screen; the page gets matching
           bottom padding (see useHead) so it never hides the last content -->
      <div
        data-tour="actions"
        class="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 shadow-[0_-4px_12px_rgb(0_0_0/0.06)] backdrop-blur dark:border-gray-700 dark:bg-gray-800/95"
      >
        <div class="relative container mx-auto px-4 py-3">
          <div
            v-if="showIssues && issues.length"
            class="absolute bottom-full left-4 right-4 mb-2 max-h-72 overflow-y-auto rounded-md bg-white p-3 shadow-xl md:left-auto md:w-[28rem] dark:bg-gray-800"
          >
            <h3
              class="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-300"
            >
              Check before exporting
            </h3>
            <ul class="space-y-1 text-sm">
              <li v-for="(issue, index) in issues" :key="index">
                <button
                  type="button"
                  class="flex w-full items-start gap-2 rounded-sm p-1 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  @click="goToIssue(issue)"
                >
                  <ExclamationCircleIcon
                    v-if="issue.severity === 'error'"
                    class="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                  />
                  <ExclamationTriangleIcon
                    v-else
                    class="mt-0.5 h-4 w-4 shrink-0 text-yellow-500"
                  />
                  <span class="flex-1">
                    {{ issue.message }}
                    <span
                      v-if="issue.advanced && !isAdvanced"
                      class="text-gray-500 dark:text-gray-400"
                    >
                      Switch to Advanced to change this.
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <p
              class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              :title="
                saveInBrowser
                  ? 'Saved in this browser'
                  : 'Not saved. Export to keep your work.'
              "
            >
              <template v-if="saveInBrowser">
                <CheckCircleIcon class="h-4 w-4 shrink-0 text-green-500" />
                <span class="max-sm:sr-only">
                  Saved in this browser<span v-if="lastSaved">
                    · {{ lastSaved }}</span
                  >
                </span>
              </template>
              <template v-else>
                <ExclamationCircleIcon
                  class="h-4 w-4 shrink-0 text-yellow-500"
                />
                <span class="max-sm:sr-only">
                  Not saved. Export to keep your work.
                </span>
              </template>
            </p>

            <div class="ml-auto flex gap-2 sm:gap-3">
              <UiButton
                :variant="
                  errorCount ? 'red' : issues.length ? 'amber' : 'green'
                "
                outlined
                :aria-expanded="showIssues"
                :disabled="!issues.length"
                @click="showIssues = !showIssues"
              >
                <ExclamationTriangleIcon v-if="issues.length" class="h-4 w-4" />
                <CheckIcon v-else class="h-4 w-4" />
                <span v-if="errorCount">
                  {{ errorCount
                  }}<span class="max-sm:sr-only">
                    error{{ errorCount === 1 ? "" : "s" }}</span
                  >
                </span>
                <span v-else-if="issues.length">
                  {{ issues.length
                  }}<span class="max-sm:sr-only">
                    warning{{ issues.length === 1 ? "" : "s" }}</span
                  >
                </span>
                <span v-else class="max-sm:sr-only">No warnings</span>
              </UiButton>
              <UiButton v-if="isAdvanced" outlined @click="showXml = true">
                <CodeBracketIcon class="h-4 w-4" />
                <span class="max-sm:sr-only">Preview XML</span>
              </UiButton>
              <UiButton
                variant="amber"
                outlined
                title="Reset VCF"
                @click="onResetVcfConfiguration"
              >
                <ArrowUturnLeftIcon class="h-4 w-4 sm:hidden" />
                <span class="max-sm:sr-only">Reset</span>
              </UiButton>
              <UiButton type="submit" size="md">
                <ArrowDownTrayIcon class="h-4 w-4" />
                <span>Generate<span class="max-sm:hidden"> VCF</span></span>
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </form>

    <XmlPreview :open="showXml" @close="showXml = false" />

    <OnboardingTour :open="tourOpen" @close="closeTour" />
  </div>
</template>

<script setup lang="ts">
import { saveAs } from "file-saver";
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  CheckIcon,
  CodeBracketIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/vue/24/solid";
import type { VcfIssue } from "~/composables/vcfValidation";
import type { EditorMode } from "~/composables/editorMode";
import { compareVersions } from "compare-versions";
import { resetVcfConfiguration } from "~/composables/vcfConfiguration";

const url = useRequestURL();
const config = useRuntimeConfig();

useHead({
  title: "MISS-ELS VCF Configurator",
  // room for the fixed action bar at the bottom
  bodyAttrs: { class: "pb-20" },
});

useSeoMeta({
  ogSiteName: "MISS-ELS",
  title: "MISS-ELS VCF Configurator",
  ogTitle: "MISS-ELS VCF Configurator",
  ogDescription:
    "Using our VCF Configurator, you can easily generate configuration files for your vehicles.",
  ogImage: `${url.origin + config.app.baseURL}images/MISS-ELS.png`,
});

const VCF = useVcfConfiguration();

const isVcfSchemaVersionUpToDate = computed(
  () =>
    compareVersions(
      VCF.value.configuration.version ?? "0.0.0",
      config.public.version as string,
    ) >= 0,
);

const onResetVcfConfiguration = () => {
  if (
    window.confirm(
      "Are you sure you want to reset? All changes to the VCF will be lost.",
    )
  ) {
    resetVcfConfiguration();
  }
};

// easy / advanced mode
const editorMode = useEditorMode();
const isAdvanced = useIsAdvanced();
const modeOptions: { value: EditorMode; label: string; title: string }[] = [
  {
    value: "easy",
    label: "Easy",
    title: "Only the settings most vehicles need",
  },
  {
    value: "advanced",
    label: "Advanced",
    title: "Every setting, including sounds, output format and extra patterns",
  },
];

// dark mode
const isDark = ref(localStorage.getItem("theme") === "dark");

watch(
  isDark,
  (dark) => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  },
  { immediate: true },
);

// local storage of the VCF
const saveInBrowser = ref(localStorage.getItem("saveVcfLocal") !== "0");
const lastSaved = ref<string | null>(null);

const setSaveInBrowser = (enabled: boolean) => {
  saveInBrowser.value = enabled;
  localStorage.setItem("saveVcfLocal", enabled ? "1" : "0");

  if (enabled) {
    // store the current state right away instead of waiting for the next edit
    localStorage.setItem("vcfConfiguration", JSON.stringify(VCF.value));
    lastSaved.value = new Date().toLocaleTimeString();
  } else {
    localStorage.removeItem("vcfConfiguration");
    localStorage.removeItem("vcfUpdated");
    lastSaved.value = null;
  }
};

watch(
  VCF,
  () => {
    if (saveInBrowser.value) lastSaved.value = new Date().toLocaleTimeString();
  },
  { deep: true },
);

const hasReadLocalStorageNotice = ref(
  localStorage.getItem("hasReadLocalStorageNotice") === "1",
);

const dismissLocalStorageNotice = () => {
  hasReadLocalStorageNotice.value = true;
  localStorage.setItem("hasReadLocalStorageNotice", "1");
};

// warnings
const issues = useVcfValidation();
const showIssues = ref(false);

watch(issues, (list) => {
  if (!list.length) showIssues.value = false;
});

const goToIssue = (issue: VcfIssue) => {
  showIssues.value = false;
  document
    .getElementById(issue.section)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const errorCount = computed(
  () => issues.value.filter((issue) => issue.severity === "error").length,
);

// output format
const outputFormat = useVcfOutputFormat();
const legacyProblems = useLegacyIncompatibilities();
const convertedFromLegacy = ref(false);

// onboarding: shown once on the first visit, skippable, and restartable
const tourOpen = ref(localStorage.getItem("onboardingDone") !== "1");

const closeTour = (completed: boolean) => {
  tourOpen.value = false;
  localStorage.setItem("onboardingDone", "1");

  // the tour explains saving in the browser, so the notice is no longer needed
  if (completed) dismissLocalStorageNotice();
};

// XML preview
const showXml = ref(false);

// import / export
const importVcf = (contents: string) => {
  try {
    const { vcf, legacy } = generateStoreAttributesFromExistingVCF(contents);
    useImportExistingConfiguration(vcf);
    convertedFromLegacy.value = legacy;
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "This file could not be imported.",
    );
  }
};

const xml = useVcfXml();

const generateVCF = () => {
  if (errorCount.value) {
    showIssues.value = true;
    return;
  }

  const blob = new Blob([xml.value], { type: "application/xml" });
  const description = VCF.value.configuration.description?.trim();
  const filename = description
    ? description.replace(/\.xml$/i, "") + ".xml"
    : "myVCF.xml";

  saveAs(blob, filename);
};
</script>

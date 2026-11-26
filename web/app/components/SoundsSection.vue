<template>
  <UiCard title="Sounds">
    <template #actions>
      <UiCheckbox v-model="VCF.configuration.useServerSirens">
        <span class="flex items-center">
          Use&nbsp;
          <a
            class="flex items-center gap-2 underline"
            href="https://github.com/Walsheyy/WMServerSirens"
            target="_blank"
            @click.stop
          >
            WMServerSirens
            <ArrowTopRightOnSquareIcon class="h-4 w-4" />
          </a>
        </span>
      </UiCheckbox>
    </template>

    <UiTable :headers="headers">
      <UiTbody>
        <UiTr v-for="(option, index) in VCF.configuration.sounds" :key="index">
          <UiTd class="font-bold">
            {{ option.name }}
          </UiTd>
          <UiTd label="Allow use">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
              <UiCheckbox v-model="option.allowUse">
                <span class="sr-only">Allow use of {{ option.name }}</span>
              </UiCheckbox>
              <UiCheckbox
                v-if="option.name === 'MainHorn' && option.allowUse"
                :model-value="!!option.interruptSiren"
                @update:model-value="option.interruptSiren = $event"
              >
                <span
                  class="text-sm font-normal"
                  title="The horn silences the siren while it sounds (MISS-ELS 3)"
                >
                  Interrupts siren
                </span>
              </UiCheckbox>
            </div>
          </UiTd>
          <UiTd
            label="Audio string"
            :class="option.audioString === undefined && 'max-md:hidden'"
          >
            <UiInput
              v-if="option.allowUse && option.audioString !== undefined"
              v-model="option.audioString"
            />
          </UiTd>
          <UiTd
            v-if="VCF.configuration.useServerSirens"
            label="Soundset"
            :class="option.soundSet === undefined && 'max-md:hidden'"
          >
            <UiInput
              v-if="option.allowUse && option.soundSet !== undefined"
              v-model="option.soundSet"
            />
          </UiTd>
        </UiTr>
      </UiTbody>
    </UiTable>
  </UiCard>
</template>

<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/solid";
import { defaultVcfConfig } from "~/composables/vcfConfiguration";

const VCF = useVcfConfiguration();

const headers = computed(() => [
  "Option",
  "Allow use",
  "Audio string",
  ...(VCF.value.configuration.useServerSirens ? ["Soundset"] : []),
]);

// NATO alphabet, so more siren options can be added without code changes.
const natoAlphabet = [
  "ALPHA",
  "BRAVO",
  "CHARLIE",
  "DELTA",
  "ECHO",
  "FOXTROT",
  "GOLF",
  "HOTEL",
  "INDIA",
  "JULIETT",
  "KILO",
  "LIMA",
  "MIKE",
  "NOVEMBER",
  "OSCAR",
  "PAPA",
  "QUEBEC",
  "ROMEO",
  "SIERRA",
  "TANGO",
  "UNIFORM",
  "VICTOR",
  "WHISKEY",
  "X-RAY",
  "YANKEE",
  "ZULU",
];

const isSirenTone = (name: string) => !["MainHorn", "NineMode"].includes(name);

// When toggling WMServerSirens, swap the siren audio strings between the
// WMServerSirens naming scheme and the default GTA sounds.
watch(
  () => VCF.value.configuration.useServerSirens,
  (useServerSirens) => {
    const defaults = defaultVcfConfig().configuration.sounds;
    const sirens = VCF.value.configuration.sounds.filter((sound) =>
      isSirenTone(sound.name),
    );

    sirens.forEach((sound, index) => {
      sound.audioString = useServerSirens
        ? `SIREN_${natoAlphabet[index]}`
        : defaults.find((d) => d.name === sound.name)?.audioString;
    });
  },
);
</script>

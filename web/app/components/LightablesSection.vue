<template>
  <UiCard title="Lightables">
    <template #actions>
      <UiButton
        :disabled="availableExtraIds.length === 0"
        @click="addLightable('extra')"
      >
        New extra
      </UiButton>
      <UiButton
        :disabled="availableMiscIds.length === 0"
        @click="addLightable('misc')"
      >
        New misc
      </UiButton>
    </template>

    <UiTable
      :headers="[
        'Lightable type',
        'Lightable ID',
        'Allow env light',
        'Color',
        '',
      ]"
    >
      <UiTbody>
        <template v-if="VCF.configuration.lightables.length">
          <UiTr
            v-for="(lightable, index) in VCF.configuration.lightables"
            :key="index"
          >
            <UiTd label="Lightable type" class="font-bold">
              <UiSelect
                :model-value="lightable.type"
                @update:model-value="
                  changeType(lightable, $event as lightableType)
                "
              >
                <option
                  value="extra"
                  :disabled="availableExtraIds.length === 0"
                >
                  Extra
                </option>
                <option value="misc" :disabled="availableMiscIds.length === 0">
                  Misc
                </option>
              </UiSelect>
            </UiTd>
            <UiTd label="Lightable ID">
              <div class="flex items-center gap-2">
                <UiSelect v-model="lightable.id">
                  <option
                    v-for="id in lightable.type === 'extra'
                      ? extraIds
                      : miscIds"
                    :key="id"
                    :value="id"
                    :disabled="isLightableIdInUse(id)"
                  >
                    {{ id }}
                  </option>
                </UiSelect>
                <span
                  v-if="!lightableIsNotInUseAsStatic(lightable.id)"
                  class="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  title="This lightable is marked as static, so it is not used in patterns"
                >
                  static
                </span>
              </div>
            </UiTd>
            <UiTd label="Allow env light">
              <UiCheckbox v-model="lightable.allowEnv">
                <span class="sr-only">Allow env light</span>
              </UiCheckbox>
            </UiTd>
            <UiTd label="Color">
              <div class="flex items-center gap-4">
                <div
                  class="h-8 w-8 shrink-0 rounded-md border-2"
                  :class="
                    lightable.color
                      ? getLightColorClasses(lightable.color)
                      : 'border-transparent'
                  "
                />

                <UiSelect
                  v-model="lightable.color"
                  :disabled="!lightable.allowEnv"
                  :title="
                    lightable.allowEnv
                      ? ''
                      : 'You need to allow env light to change the color'
                  "
                >
                  <option :value="null">Choose...</option>
                  <option v-for="color in colors" :key="color" :value="color">
                    {{ color }}
                  </option>
                </UiSelect>
              </div>
            </UiTd>
            <UiTd>
              <UiButton variant="red" @click="removeLightable(index)">
                <span class="sr-only">Remove lightable</span>
                <XMarkIcon class="h-5 w-5" />
              </UiButton>
            </UiTd>
          </UiTr>
        </template>

        <UiTr v-else>
          <UiTd colspan="5">
            <em>
              You have not configured any lightables. Create one by clicking the
              '<strong>New extra</strong>' or '<strong>New misc</strong>'
              button.
            </em>
          </UiTd>
        </UiTr>
      </UiTbody>
    </UiTable>
  </UiCard>
</template>

<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/solid";
import type { Color, Lightable, lightableType } from "~/types/lights";
import { getLightColorClasses } from "~/utils/uiClasses";

const colors: Color[] = ["blue", "amber", "red", "green", "white"];

const VCF = useVcfConfiguration();

const removeLightable = (index: number) => {
  VCF.value.configuration.lightables.splice(index, 1);
};

// the "new" buttons and type options are disabled when no ID is left, so an ID
// is always available here
const getNewLightableId = (type: lightableType) =>
  (type === "extra"
    ? availableExtraIds.value[0]
    : availableMiscIds.value[0]) as Lightable["id"];

const changeType = (lightable: Lightable, type: lightableType) => {
  lightable.type = type;
  lightable.id = getNewLightableId(type);
};

const addLightable = (type: lightableType) => {
  VCF.value.configuration.lightables.push({
    type,
    id: getNewLightableId(type),
    enabled: true,
    allowEnv: false,
    color: null,
  });
};
</script>

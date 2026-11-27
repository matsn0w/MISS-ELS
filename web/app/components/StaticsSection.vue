<template>
  <UiCard title="Statics">
    <template #actions>
      <UiButton
        :disabled="
          !availableStaticMiscIds.length && !availableStaticExtraIds.length
        "
        @click="addStatic"
      >
        New
      </UiButton>
    </template>

    <UiTable :headers="['Lightable type', 'Lightable id', 'Name', '']">
      <UiTbody>
        <template v-if="VCF.configuration.statics.length">
          <UiTr v-for="(s, index) in VCF.configuration.statics" :key="index">
            <UiTd label="Lightable type">
              <UiSelect
                :model-value="s.type"
                @update:model-value="changeType(s, $event as lightableType)"
              >
                <option
                  value="extra"
                  :disabled="availableStaticExtraIds.length === 0"
                >
                  Extra
                </option>
                <option
                  value="misc"
                  :disabled="availableStaticMiscIds.length === 0"
                >
                  Misc
                </option>
              </UiSelect>
            </UiTd>
            <UiTd label="Lightable id">
              <UiSelect v-model="s.id">
                <option
                  v-for="id in s.type === 'extra'
                    ? elsEnabledExtraIds
                    : elsEnabledMiscIds"
                  :key="id"
                  :value="id"
                  :disabled="isLightableIdInUseByStatic(id)"
                >
                  {{ id }}
                </option>
              </UiSelect>
            </UiTd>
            <UiTd label="Name">
              <UiInput v-model="s.name" />
            </UiTd>
            <UiTd>
              <UiButton variant="red" @click="removeStatic(index)">
                <span class="sr-only">Remove static</span>
                <XMarkIcon class="h-5 w-5" />
              </UiButton>
            </UiTd>
          </UiTr>
        </template>

        <UiTr v-else>
          <UiTd colspan="4">
            <em>
              You have not configured any statics. Create one by clicking the
              '<strong>New</strong>' button. Please be aware that you need to
              add 'Lightables' before you can mark them as static.
            </em>
          </UiTd>
        </UiTr>
      </UiTbody>
    </UiTable>
  </UiCard>
</template>

<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/solid";
import type {
  letterLightableId,
  lightableType,
  numericalLightableId,
} from "~/types/lights";
import type { staticType } from "~/types/static";

const VCF = useVcfConfiguration();

const isLightableIdInUseByStatic = (
  id: letterLightableId | numericalLightableId,
) => VCF.value.configuration.statics.some((s) => s.id === id);

const elsEnabledExtraIds = computed(() =>
  extraIds.filter((extraId) => isLightableIdInUse(extraId)),
);
const elsEnabledMiscIds = computed(() =>
  miscIds.filter((miscId) => isLightableIdInUse(miscId)),
);
const availableStaticMiscIds = computed(() =>
  elsEnabledMiscIds.value.filter((id) => !isLightableIdInUseByStatic(id)),
);
const availableStaticExtraIds = computed(() =>
  elsEnabledExtraIds.value.filter((id) => !isLightableIdInUseByStatic(id)),
);

const changeType = (s: staticType, type: lightableType) => {
  s.type = type;
  s.id =
    (type === "extra"
      ? availableStaticExtraIds.value[0]
      : availableStaticMiscIds.value[0]) ?? null;
};

const addStatic = () => {
  useAddStatic({
    type: availableStaticExtraIds.value.length ? "extra" : "misc",
    id:
      availableStaticExtraIds.value[0] ??
      availableStaticMiscIds.value[0] ??
      null,
    name: null,
  });
};

const removeStatic = (index: number) => {
  useRemoveStatic(index);
};
</script>

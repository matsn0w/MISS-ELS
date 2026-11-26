<template>
  <Transition
    enter-from-class="translate-x-full"
    leave-to-class="translate-x-full"
    enter-active-class="transition-transform duration-200"
    leave-active-class="transition-transform duration-200"
  >
    <aside
      v-if="open"
      class="fixed inset-y-0 right-0 z-40 flex w-full flex-col bg-white shadow-2xl md:w-[40rem] dark:bg-gray-800"
      aria-label="XML preview"
    >
      <header
        class="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-700"
      >
        <h2 class="font-semibold text-gray-800 dark:text-gray-300">
          XML preview
        </h2>
        <UiButton class="ml-auto" outlined @click="copy">
          <CheckIcon v-if="copied" class="h-4 w-4" />
          <ClipboardDocumentIcon v-else class="h-4 w-4" />
          {{ copied ? "Copied" : "Copy" }}
        </UiButton>
        <UiButton variant="gray" outlined title="Close" @click="emit('close')">
          <XMarkIcon class="h-4 w-4" />
          <span class="sr-only">Close XML preview</span>
        </UiButton>
      </header>

      <pre
        class="flex-1 overflow-auto bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      ><code><span
        v-for="(token, index) in tokens"
        :key="index"
        :class="xmlTokenClasses[token.type]"
      >{{ token.text }}</span></code></pre>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import {
  CheckIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
} from "@heroicons/vue/24/solid";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const xml = useVcfXml();
const tokens = computed(() => highlightXml(xml.value));
const copied = ref(false);

const copy = async () => {
  await navigator.clipboard.writeText(xml.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.open) emit("close");
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

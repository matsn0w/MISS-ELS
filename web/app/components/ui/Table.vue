<template>
  <div class="relative p-3 md:overflow-x-auto">
    <!-- below md the table collapses into stacked cards; cells show their
         column name through UiTd's `label` -->
    <table
      class="w-full table-auto text-sm text-gray-700 max-md:block dark:text-gray-300"
    >
      <thead
        class="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-400 max-md:hidden dark:bg-gray-700"
      >
        <tr>
          <th
            v-for="(header, index) in headers"
            :key="index"
            class="p-2 align-middle font-semibold"
          >
            {{ header }}
          </th>
        </tr>
      </thead>

      <slot />
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{ headers: string[] }>();
</script>

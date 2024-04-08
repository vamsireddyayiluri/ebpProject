<script setup>
const props = defineProps({
  data: Object,
})
</script>

<template>
  <Typography>
    <template v-if="data.flexibleBooking">
      <template
        v-for="i in data.size"
        :key="i"
      >
        {{ i }}
        <br />
      </template>
    </template>
    <template v-else>
      {{ data.size }}
    </template>
  </Typography>
</template>

<script setup>
const attrs = useAttrs()
</script>

<template>
  <RadioGroup v-bind="{ ...attrs }">
    <Radio
      value="notifications on the platform"
      label="Get notifications on the platform"
    />
    <Radio
      value="notifications by email"
      label="Get notifications by email"
      class="my-4"
    />
    <Radio
      value="both notifications"
      label="Get notifications both on the platform and by email"
    />
  </RadioGroup>
</template>

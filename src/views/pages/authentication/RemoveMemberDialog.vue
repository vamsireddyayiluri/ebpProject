<script setup>
const props = defineProps({
  dialog3: Object,
})

console.log('=>(RemoveMemberDialog.vue:7) props', props)
</script>

<template>
  <Dialog ref="dialog3">
    <template #title> Dialog 3 </template>
    <template #text>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </template>
    <template #actions>
      <Button block variant="plain" @click="dialog3.show(false)">
        Close Dialog
      </Button>
    </template>
  </Dialog>
</template>

<style lang="scss" scoped></style>

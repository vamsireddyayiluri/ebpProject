<script setup>
const onSave = () => {
}
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Team members
  </Typography>
  <TeamMembers class="w-full md:w-11/12 lg:w-8/12" />
  <SaveCancelChanges
    class="mt-10"
    @onSave="onSave"
  />
</template>

<style lang="scss" scoped>

</style>

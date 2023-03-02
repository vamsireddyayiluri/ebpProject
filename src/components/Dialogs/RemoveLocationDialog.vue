<script setup>
const props = defineProps({
  removedLocation: Object,
})
const emit = defineEmits(['onRemove'])
const removeLocation = locationId => {
  emit('onRemove', locationId)
}
</script>
<template>
  <div class="pa-0">
    Are you sure you want to remove Good location
    <Typography type="text-body-m-semibold" class="d-inline">
      {{ removedLocation.value }}
    </Typography>
    from your locations?
  </div>
  <Button class="w-100 mt-6" @click="removeLocation(removedLocation.id)"> Remove </Button>
</template>
<style lang="scss" scoped></style>

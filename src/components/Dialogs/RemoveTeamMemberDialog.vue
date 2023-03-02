<script setup>
const props = defineProps({
  removedMember: Object,
})
const emit = defineEmits(['onRemove'])
const removeMember = memberId => {
  emit('onRemove', memberId)
}
</script>
<template>
  <div class="pa-0">
    Are you sure you want to remove
    <Typography type="text-body-m-semibold" class="d-inline">
      Member {{ removedMember.value }}
    </Typography>
    from the team?
  </div>
  <Button class="w-100 mt-6" @click="removeMember(removedMember.id)"> Remove </Button>
</template>
<style lang="scss" scoped></style>

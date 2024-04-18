<script setup>
const props = defineProps({
  btnName: {
    type: String,
    default: 'Remove',
  },
  btnType: {
    type: String,
    default: 'secondary1',
  },
})
const emit = defineEmits(['close', 'containerActionHandler', 'onClickBtn'])

const containerActionHandler = ({ action, e }) => {
  emit('containerActionHandler', { action, e })
}
</script>

<template>
  <div>
    <div class="flex justify-between mb-8">
      <slot />
      <IconButton
        icon="mdi-close"
        class="-mt-1"
        @click="emit('close')"
      />
    </div>
    <Button
      :data="btnType"
      class="w-full mb-1"
      @click="emit('onClickBtn')"
    >
      {{ btnName }}
    </Button>
  </div>
</template>

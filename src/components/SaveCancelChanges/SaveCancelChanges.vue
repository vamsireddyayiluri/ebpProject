<script setup>
import { useAlertStore } from '~/stores/alert.store'

const props = defineProps({
  disabled: Boolean,
})
const emit = defineEmits(['onSave', 'onCancel'])
const attrs = useAttrs()

const saveDialog = ref(null)
const alertStore = useAlertStore()

const onSave = () => {
  saveDialog.value.show(false)
  emit('onSave')
}
</script>

<template>
  <div v-bind="{ ...attrs }">
    <Button
      class="mr-4"
      :disabled="disabled"
      type="submit"
      @click="saveDialog.show(true)"
    >
      Save
    </Button>
    <Button
      variant="outlined"
      :disabled="disabled"
      @click="emit('onCancel')"
    >
      Cancel changes
    </Button>
  </div>

  <Dialog
    ref="saveDialog"
    max-width="480"
  >
    <template #text>
      <div class="flex justify-between mb-7">
        <Typography> Are you sure you want to save changes? </Typography>
        <IconButton
          icon="mdi-close"
          class="-mt-1"
          @click="saveDialog.show(false)"
        />
      </div>
      <Button
        class="w-full"
        @click="onSave"
      >
        Save
      </Button>
    </template>
  </Dialog>
</template>

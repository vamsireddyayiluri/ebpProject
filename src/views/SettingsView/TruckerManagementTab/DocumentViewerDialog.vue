<script setup>
import { useDocumentsChip } from '~/composables'
import { capitalize } from 'lodash'

const props = defineProps({
  doc: Object,
})
const emit = defineEmits(['close', 'download'])
const comment = ref(null)
const leaveCommentDialog = ref(null)
const docxFileUrl = ref(null)

onMounted(async () => {
  if (props.doc.type !== 'pdf' && props.doc.type !== 'txt') {
    try {
      const timestamp = new Date().getTime()
      const url = await encodeURIComponent(props.doc.url)
      setTimeout(() => {
        docxFileUrl.value = `https://docs.google.com/viewer?embedded=true&url=${url}&timestamp=${timestamp}`
      }, 10)
    } catch (error) {
      console.log('error ->', error)
    }
  }
})
</script>

<template>
  <div class="flex">
    <IconButton
      icon="mdi-download"
      class="ml-auto mr-1"
      @click="emit('download')"
    />
    <IconButton
      icon="mdi-close"
      @click="emit('close')"
    />
  </div>
  <Typography type="text-h3 text-center -mt-3 mb-6">
    {{ doc.label }}
  </Typography>
  <Typography class="max-h-[520px] overflow-auto">
    <iframe
      v-if="doc.type === 'pdf' || doc.type === 'txt'"
      :src="doc.url"
      width="100%"
      height="380px"
    />
    <iframe
      v-else
      :src="docxFileUrl"
      width="100%"
      height="380px"
    />
  </Typography>
  <div class="flex gap-5 mt-4">
    <Chip
      v-if="doc.status !== 'notConsider'"
      :prepend-icon="useDocumentsChip()[doc.status]?.icon"
      :color="useDocumentsChip()[doc.status]?.color"
    >
      {{ capitalize(doc.status) }}
    </Chip>
    <Button
      variant="plain"
      class="ml-auto"
      @click="leaveCommentDialog.show(true)"
    >
      decline
    </Button>
    <Button @click="emit('close')">
      accept
    </Button>
  </div>
  <Dialog
    ref="leaveCommentDialog"
    max-width="620"
  >
    <template #text>
      <div class="flex justify-between mb-3">
        <Typography type="text-h3">
          Leave comment
        </Typography>
        <IconButton
          icon="mdi-close"
          class="-mt-1"
          @click="leaveCommentDialog.show(false)"
        />
      </div>
      <Textarea
        v-model="comment"
        label="Explain what is wrong"
      />
      <Button
        class="float-right mt-6"
        @click="leaveCommentDialog.show(false)"
      >
        send
      </Button>
    </template>
  </Dialog>
</template>

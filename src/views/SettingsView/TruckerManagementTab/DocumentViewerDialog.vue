<script setup>
import { useDocumentsChip } from '~/composables'
import { capitalize } from 'lodash'

const props = defineProps({
  doc: Object,
})
const emit = defineEmits(['close'])
const comment = ref(null)
const leaveCommentDialog = ref(null)
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
    Main document
  </Typography>
  <Typography class="max-h-[520px] overflow-auto">
    Protecting your private information is our priority. This Statement of Privacy applies to the
    www.heytutor.com and HeyTutor LLC. and governs data collection and usage. For the purposes of
    this Privacy Policy, unless otherwise noted, all references to HeyTutor LLC. include
    www.heytutor.com and HeyTutor. The HeyTutor website is a online marketplace site. By using the
    HeyTutor website, you consent to the data practices described in this statement. Protecting your
    private information is our priority. This Statement of Privacy applies to the www.heytutor.com
    and HeyTutor LLC. and governs data collection and usage. For the purposes of this Privacy
    Policy, unless otherwise noted, all references to HeyTutor LLC. include www.heytutor.com and
    HeyTutor. The HeyTutor website is a online marketplace site. By using the HeyTutor website, you
    consent to the data practices described in this statement. Protecting your private information
    is our priority. This Statement of Privacy applies to the www.heytutor.com and HeyTutor LLC. and
    governs data collection and usage. For the purposes of this Privacy Policy, unless otherwise
    noted, all references to HeyTutor LLC. include www.heytutor.com and HeyTutor. The HeyTutor
    website is a online marketplace site. By using the HeyTutor website, you consent to the data
    practices described in this statement. Protecting your private information is our priority. This
    Statement of Privacy applies to the www.heytutor.com and HeyTutor LLC. and governs data
    collection and usage. For the purposes of this Privacy Policy, unless otherwise noted, all
    references to HeyTutor LLC. include www.heytutor.com and HeyTutor. The HeyTutor website is a
    online marketplace site. By using the HeyTutor website, you consent to the data practices
    described in this statement. Protecting your private information is our priority. This Statement
    of Privacy applies to the www.heytutor.com and HeyTutor LLC. and governs data collection and
    usage. For the purposes of this Privacy Policy, unless otherwise noted, all references to
    HeyTutor LLC. include www.heytutor.com and HeyTutor. The HeyTutor website is a online
    marketplace site. By using the HeyTutor website, you consent to the data practices described in
    this statement.
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

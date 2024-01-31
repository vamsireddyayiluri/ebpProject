<script setup>
import { getColor } from '~/helpers/colors'
import { storeToRefs } from "pinia"
import { useTruckerManagementStore } from "~/stores/truckerManagement.store"


const props = defineProps({
  scacSection: {
    type: Boolean,
    default: () => true,
  },
})
const truckerManagement = useTruckerManagementStore()

const {  requiresForTruckers,preferredTruckersList, questionList } = storeToRefs(truckerManagement)
const question = ref(null)
const items = ref(preferredTruckersList)
const inviteTruckerDialog = ref(false)

const scacList = ['aass', 'qqww']
let filteredScacList = ref([])
let search = ref('')

const removeTrucker = item => {
  const index = preferredTruckersList.value.findIndex(i => i === item)
  items.value.splice(index, 1)
}

const filterItems = event => {
  search.value = event.target.value
  const filter = scacList.filter(val => val.toLowerCase() === search.value.toLowerCase())
  if (filter?.length) {
    filteredScacList.value.push(...filter)
  } else {
    filteredScacList.value.splice(0, filteredScacList.value.length)
  }
}
const clearData = event => {
  search.value = ''
  filteredScacList.value = []
}
const confirmSendInvitation = trucker => {
  inviteTruckerDialog.value.show(true)
  inviteTruckerDialog.value.data = trucker
}
</script>

<template>
  <template v-if="scacSection">
    <Typography type="text-body-m-semibold mb-6 text-left">
      Search truckers you already work with by SCAC code and add them to your Preferred truckers list
    </Typography>
    <Autocomplete
      v-model="items"
      :items="filteredScacList"
      placeholder="Seach for truckers by SCAC"
      prepend-inner-icon="mdi-magnify"
      multiple
      with-btn
      @input="filterItems"
      @blur="clearData"
      class="text-left"
    >
      <template #no-data>
        <Typography class="mb-5 inline-block">
          Do you want to send an invitation via email?
        </Typography>
        <Button
          class="w-full"
          @click="confirmSendInvitation"
        >
          Invite new trucker
        </Button>
      </template>
    </Autocomplete>
    <div class="flex gap-3 mt-3 mb-8">
      <template
        v-for="i in items"
        :key="i"
      >
        <Chip
          closable
          @click:close="removeTrucker(i)"
        >
          {{ i }}
        </Chip>
      </template>
    </div>
  </template>
  <Typography type="text-body-m-semibold mb-6 text-left">
    We will automatically collect the following information from each trucker as part of the onboarding process,
    what other additional information will be required to onboard trucking companies wanting to move export loads for you?
    (You’ll have a chance to add your own documents and PDFs/onboarding documents on the next screen)
  </Typography>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5">
    <template
      v-for="(i, n) in requiresForTruckers"
      :key="n"
    >
      <Checkbox
        v-model="requiresForTruckers[n].status"
        :label="i.label"
      />
    </template>
  </div>
  <Typography type="text-body-m-semibold mt-10 mb-6 text-left">
    Type additional questions here
  </Typography>
  <div class="flex gap-5">
    <Textfield
      v-model.trim="question"
      label="Question for trucker"
    />
    <IconButton
      width="48"
      height="48"
      variant="outlined"
      :color="getColor('uiLine')"
      :disabled="!question"
      @click="truckerManagement.addAdditionalQuestion(question), question = null"
    >
      <Icon
        icon="mdi-plus"
        size="24"
        :color="getColor('iconButton-1')"
      />
    </IconButton>
  </div>
  <template
    v-for="i in questionList"
    :key="i"
  >
    <div class="flex gap-5 mt-5">
      <Textfield
        :model-value="i"
        label="Question for trucker"
        readonly
        class="pointer-events-none"
      />
      <IconButton
        icon="mdi-delete"
        size="24"
        variant="plain"
        width="48"
        height="48"
        @click.stop="truckerManagement.removeQuestion(i)"
      />
    </div>
  </template>
   <Dialog
    ref="inviteTruckerDialog"
    max-width="480"
  >
    <template #text>
      <InviteTruckerDialog @close="inviteTruckerDialog.show(false)" />
    </template>
  </Dialog>
</template>

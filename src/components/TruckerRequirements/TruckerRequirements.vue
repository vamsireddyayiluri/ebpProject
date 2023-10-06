<script setup>
import { getColor } from '~/helpers/colors'
import { storeToRefs } from "pinia"
import { useAuthStore } from '~/stores/auth.store'

const authStore = useAuthStore()
const { requiresForTruckers, preferredTruckersList, questionList } = storeToRefs(authStore)
const question = ref(null)
</script>

<template>
  <Typography type="text-body-m-semibold mb-6 text-left">
    Search truckers you already work with by SCAC code and add them to your Preferred truckers list
  </Typography>
  <Autocomplete
    v-model="preferredTruckersList"
    :items="[
      {
        id: 0,
        label: 'aass',
      },
      {
        id: 1,
        label: 'qqww',
      },
      {
        id: 2,
        label: 'ccvv',
      },
    ]"
    label="Seach for truckers by SCAC"
    prepend-inner-icon="mdi-magnify"
    return-object
    closeable-chips
    chips
    multiple
    class="text-left"
  />
  <Typography type="text-body-m-semibold mt-12 mb-6 text-left">
    Which of the following do you require for truckers to onboard with your company?*
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
  <Typography type="text-body-m-semibold mt-12 mb-6 text-left">
    Type additional questions here
  </Typography>
  <div class="flex gap-5">
    <Textfield
      v-model="question"
      label="Question for trucker"
    />
    <IconButton
      width="48"
      height="48"
      variant="outlined"
      :color="getColor('uiLine')"
    >
      <Icon
        icon="mdi-plus"
        size="24"
        :color="getColor('iconButton-1')"
        @click="authStore.addAdditionalQuestion(question), question = null"
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
        @click.stop="authStore.removeQuestion(question)"
      />
    </div>
  </template>
</template>
<script setup>
import { getColor } from '~/helpers/colors'
import { onboardingCodes } from '~/constants/reasonCodes'

const props = defineProps({
  title: String,
  subTitle: String,
  btnName: String,
  selectLabel: String,
  reasonList: Array,
  committed: Number,
  loading: Boolean,
})

const emit = defineEmits(['close', 'onClickBtn'])

const reportReason = ref(null)
const yourReason = ref()
const onBoardedContainers = ref()
const { committed, loading } = toRefs(props)
const extended = computed(() => reportReason.value === onboardingCodes.inComplete || reportReason.value === onboardingCodes.other)
const containers = computed(() => reportReason.value === onboardingCodes.onboardMovedLoad)

const onReport = () => {
  emit(
    'onClickBtn',
    extended.value ? yourReason.value : reportReason.value,
    reportReason.value === onboardingCodes.onboarded? committed.value: onBoardedContainers.value,
  )
}
const checkValue = value => {
  if (value > committed.value) {
    return `Value should not be greater than ${committed.value}`
  } else if (value <= 0 || !Number.isInteger(value)) {
    return 'Value should be positive integer'
  }else{
    return true
  }
}
watch(reportReason, () => {
  yourReason.value = ''
  onBoardedContainers.value = 0
})
</script>

<template>
  <div class="px-1.5 px-1">
    <div class="flex justify-between items-center">
      <Typography type="text-h4">
        {{ title }}
      </Typography>
      <IconButton
        icon="mdi-close"
        @click="emit('close')"
      />
    </div>

    <Typography
      v-if="subTitle"
      type="text-body-m-regular"
      :color="getColor('textSecondary')"
      class="mt-2 mb-6"
    >
      {{ subTitle }}
    </Typography>
    <div
      v-else
      class="mt-2 mb-6"
    >
      <slot />
    </div>
    <Select
      v-model="reportReason"
      :items="reasonList"
      :label="selectLabel"
    />
    <template v-if="extended">
      <Textarea
        v-model.trim="yourReason"
        label="Add your reason *"
        rows="3"
        maxlength="150"
        class="mt-4"
      />
    </template>
    <template v-if="containers">
      <Textfield
        v-model.number="onBoardedContainers"
        type="number"
        label="Number of loads moved *"
        :error-messages="checkValue(onBoardedContainers)"
        rows="3"
        maxlength="150"
        class="mt-4"
      />
    </template>
    <Button
      class="w-full mt-6"
      :disabled="!reportReason || (extended && !yourReason) || (containers && !onBoardedContainers) || (reportReason===onboardingCodes.onboardMovedLoad && checkValue(onBoardedContainers)!==true)"
      :loading="loading"
      @click="onReport"
    >
      {{ btnName }}
    </Button>
  </div>
</template>

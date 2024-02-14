<script setup>
import { getColor } from '~/helpers/colors'
import { canceledCodes } from '~/constants/reasonCodes'

const props = defineProps({
  title: String,
  subTitle: String,
  btnName: String,
  selectLabel: String,
  reasonList: Array,
})

const emit = defineEmits(['close', 'onReport'])

const reportReason = ref()
const yourReason = ref()
const other = canceledCodes.other

const onReport = () => {
  emit('onReport', reportReason.value === other ? yourReason.value : reportReason.value)
}
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
    <template v-if="reportReason === other">
      <Textarea
        v-model="yourReason"
        label="Add your reason *"
        rows="3"
        maxlength="150"
        class="mt-4"
      />
    </template>
    <Button
      data="secondary1"
      class="w-full mt-6"
      :disabled="!reportReason || (reportReason === other && !yourReason)"
      @click="onReport"
    >
      {{ btnName }}
    </Button>
  </div>
</template>

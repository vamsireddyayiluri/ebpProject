<script setup>
import moment from 'moment-timezone'

const props = defineProps({
  title: String,
  subTitle: String,
  btnName: String,
  loading: Boolean,
  loadingDate: String,
})
const emit = defineEmits(['close', 'onClickBtn', 'onClickUpdate'])
const initialLoadingDate = ref(new Date())
const currentDate = ref(new Date())
const loadingDate = ref(null)
const {loading} = toRefs(props)

const updateLoadingDate = value => {
  loadingDate.value = moment(value).endOf('day').format()
}
const validateLoadingDate = () => {
  if (loadingDate.value && initialLoadingDate.value) {
    return moment(loadingDate.value).endOf('day').format() ===
      moment(initialLoadingDate.value).endOf('day').format()
  }

  return true
}
const onUpdate = () => {
  emit('onClickUpdate', loadingDate.value)
}
onMounted(async () => {
  initialLoadingDate.value = new Date(props.loadingDate)

  loadingDate.value = new Date(props.loadingDate)
})
</script>

<template>
  <div class="flex justify-between items-center">
    <Typography type="text-h4">
      {{ subTitle }}
    </Typography>
    <IconButton
      icon="mdi-close"
      @click="emit('close')"
    />
  </div>

  <Datepicker
    :picked="loadingDate || props.loadingDate"
    class="mt-6 mb-10 pb-4 updateLoadingDate"
    label="Loading date *"
    typeable
    :lower-limit="currentDate"
    @onUpdate="updateLoadingDate"
  />
  <Button
    class="w-full mt-4"
    :disabled="validateLoadingDate()"
    :loading="loading"
    @click="onUpdate"
  >
    {{ btnName }}
  </Button>
</template>

<style lang="scss">
  .updateLoadingDate {
    .v3dp__popout {
      position: fixed !important;
    }
  }
</style>

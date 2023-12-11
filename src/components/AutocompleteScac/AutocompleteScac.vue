<script setup>
import { getColor } from '~/helpers/colors'

const props = defineProps({
  scacList: {
    type: Object,
    default: () => {list: []},
  },
  menuBtn: {
    type: Boolean,
    default: () => true,
  },
})

const emit = defineEmits(['onChange'])

const attrs = useAttrs()
const scacList = toRef(props.scacList, 'list')
const preferredTruckersList = ref(['qqww', 'ggtr', 'asty'])
const sendDialog = ref(null)
const autocompleteValue = ref(null)
const marginBottom = ref('')

const removeScac = e => {
  scacList.value = useArrayFilter(scacList, i => i !== e).value
}
const sendToMarketplace = () => {
  sendDialog.value.show(false)
  autocompleteValue.value = 'Truckers from marketplace'
}
const updateModelValue = updatedScacList => {
  if (autocompleteValue.value) autocompleteValue.value = null

  emit('onChange', updatedScacList)
}
const updateMenu = e => {
  if (!e && scacList.value?.length) {
    // add margin when menu is closed
    marginBottom.value = 'mb-10'
  } else marginBottom.value = ''
}
onMounted(() => {
  if (scacList.value?.length) {
    marginBottom.value = 'mb-10'
  }
})
onUpdated(() => {
  if (!scacList.value?.length) {
    marginBottom.value = ''
  }
})
</script>

<template>
  <div
    :class="marginBottom"
    v-bind="{ ...attrs }"
  >
    <Autocomplete
      v-model="scacList"
      :items="preferredTruckersList"
      placeholder="Choose truckers by SCAС *"
      multiple
      with-btn
      :disabled="attrs.disabled"
      :value="autocompleteValue"
      @update:menu="updateMenu"
      @update:modelValue="updateModelValue"
    >
      <template
        v-if="menuBtn"
        #prepend-item
      >
        <div class="flex items-center ml-4">
          <SvgIcon
            icon="market"
            size="24"
            :color="getColor('iconButton-1')"
          />
          <Button
            variant="plain"
            @click="sendDialog.show(true)"
          >
            Truckers from marketplace
          </Button>
        </div>
      </template>
    </Autocomplete>
    <div
      v-if="scacList?.length || !menuBtn"
      class="my-4 flex flex-wrap gap-2"
    >
      <template
        v-for="i in scacList"
        :key="i"
      >
        <Chip
          closable
          @click:close="removeScac(i)"
        >
          {{ i }}
        </Chip>
      </template>
    </div>
    <div
      v-else
      class="h-16"
    />
  </div>
  <Dialog
    ref="sendDialog"
    class="max-w-[450px] md:max-w-[560px]"
  >
    <template #text>
      <VRow
        no-gutters
        justify="space-between"
        class="flex-nowrap mb-8"
      >
        <Typography>
          Are you sure you want to send this booking to truckers from marketplace?
        </Typography>
        <IconButton
          icon="mdi-close"
          class="-mt-1"
          @click="sendDialog.show(false)"
        />
      </VRow>
      <Button
        class="w-full"
        @click="sendToMarketplace"
      >
        send
      </Button>
    </template>
  </Dialog>
</template>

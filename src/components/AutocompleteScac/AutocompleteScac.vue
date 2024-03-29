<script setup>
import { getColor } from '~/helpers/colors'
import { getTruckers } from '~/stores/helpers'

const props = defineProps({
  scacList: {
    type: Object,
    default: () => {
      list: []
    },
  },
  menuBtn: {
    type: Boolean,
    default: () => false,
  },
})

const emit = defineEmits(['onChange'])

const attrs = useAttrs()
const truckers = ref([])
const scacList = toRef(props.scacList, 'list')
const sendDialog = ref(null)
const autocompleteValue = ref(null)

const removeScac = e => {
  scacList.value = useArrayFilter(scacList, i => i !== e).value
  emit('onChange', scacList.value)
}
const sendToMarketplace = () => {
  sendDialog.value.show(false)
  autocompleteValue.value = 'Truckers from marketplace'
}
const updateModelValue = updatedScacList => {
  scacList.value = updatedScacList
  emit('onChange', updatedScacList)
}
defineExpose({
  updateModelValue,
})
onMounted(async () => {
  truckers.value = await getTruckers()
})
</script>

<template>
  <div v-bind="{ ...attrs }">
    <Autocomplete
      v-model="scacList"
      :items="truckers.map(i => i.scac)"
      placeholder="Choose truckers by SCAС *"
      multiple
      with-btn
      :menu-props="{ maxHeight: 300 }"
      :rules="attrs.rules"
      :disabled="attrs.disabled"
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
  </div>
  <div
    v-if="scacList?.length"
    class="mt-4 flex flex-wrap gap-2"
  >
    <template
      v-for="i in scacList"
      :key="i"
    >
      <Chip
        closable
        :disabled="attrs.disabled"
        @click:close="removeScac(i)"
      >
        {{ i }}
      </Chip>
    </template>
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

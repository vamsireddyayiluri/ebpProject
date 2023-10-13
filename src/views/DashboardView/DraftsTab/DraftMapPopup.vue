<script setup>
import { getColor } from '~/helpers/colors'

const props = defineProps({
  draft: Object,
})
const attrs = useAttrs()
</script>

<template>
  <div
    class="w-[316px] py-6 px-7 rounded-md"
    v-bind="{ ...attrs }"
    :style="{ background: getColor('uiPrimary') }"
  >
    <Typography type="text-h3">
      {{ draft.location.address }}
    </Typography>
    <Typography
      :color="getColor('textSecondary')"
      class="mt-2 mb-5"
    >
      {{ `You have ${draft.entities.length} draft bookings in this yard` }}
    </Typography>
    <template
      v-for="i in draft.entities"
      :key="i.ref"
    >
      <Card
        :color="getColor('uiSecondary-01')"
        class="w-full h-7 pt-1 px-2 mt-1 flex justify-between items-center elevation-0 group"
      >
        <Typography type="text-body-s-regular">
          Ref#
          <b>{{ i.ref }}</b>
        </Typography>
        <Button
          variant="plain"
          density="compact"
          class="hidden group-hover:block !p-0 ml-auto"
        >
          Go to booking page
        </Button>
      </Card>
    </template>
  </div>
</template>

<style lang="scss">
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>

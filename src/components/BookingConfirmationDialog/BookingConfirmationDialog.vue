<script setup>
import logo from '~/assets/images/logo.png'
import { getColor } from '~/helpers/colors'

const props = defineProps({
  commitments: Array,
})
const emit = defineEmits(['checkPending'])
const checkPending = e => {
  emit('checkPending', e)
}
</script>

<template>
  <div class="mx-auto pt-2 pb-1">
    <img
      :src="logo"
      alt="qualle logo"
      class="h-9 mx-auto mb-4"
    />
    <Typography
      :color="getColor('textPrimary')"
      class="text-center mb-8"
    >
      Please perform actions on approved/pending commitments for the previous booking before
      creating a new booking with the same export yard. Thank You.
    </Typography>
    <CommitmentsTable
      :commitments="commitments"
      @close="e => checkPending(e)"
    />
  </div>
</template>

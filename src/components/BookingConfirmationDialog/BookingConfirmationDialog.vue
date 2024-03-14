<script setup>
import logo from '~/assets/images/logo.png'
import { getColor } from '~/helpers/colors'

const props = defineProps({
  commitments: Array,
})
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
      Please complete the approved/pending commitments for the previous bookings you created before
      creating a new one. Thank You.
    </Typography>
    <CommitmentsTable :commitments="commitments" />
  </div>
</template>

<script setup>
import { getColor } from '~/helpers/colors'
import alert from '~/assets/images/alert.svg'
</script>

<template>
  <div class="wrapper">
    <img
      :src="alert"
      alt="alert!"
    >
    <Typography
      type="text-h1"
      class="mt-6 mb-3"
    >
      Invitation revoked
    </Typography>
    <Typography
      type="text-body-m-regular"
      :style="{ color: getColor('textSecondary') }"
    >
      The page you are looking for doesn't exist anymore. Please contact your admin.
    </Typography>
  </div>
</template>

<style lang="scss">
.wrapper {
  margin: 180px auto 0 auto;
  width: 410px;
}
</style>

<route lang="yaml">
meta:
  layout: auth
</route>

<script setup>
import { Auth } from '@layouts'

const continueRegistration = ref()
</script>

<template>
  <Auth>
    <RegisterView v-if="continueRegistration" />
    <BeforeRegisterView v-else @handleClick="continueRegistration = true"/>
  </Auth>
</template>

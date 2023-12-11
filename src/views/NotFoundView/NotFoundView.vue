<script setup>
import { Main } from '@layouts'
import { getColor } from '~/helpers/colors'
import container from '~/assets/images/container.png'

const router = useRouter()
</script>

<template>
  <Main>
    <div class="w-full h-[calc(100vh-64px)] flex justify-center items-center">
      <div class="flex flex-wrap justify-center items-center">
        <img
          :src="container"
          class="container-img"
          alt="qualle container"
        >
        <div class="flex flex-col content">
          <Typography
            type="text-h1"
            class="!text-7xl mb-4"
          >
            404
          </Typography>
          <Typography
            type="text-h1"
            class="mb-4"
          >
            We can't find this page..
          </Typography>
          <Typography
            type="text-body-s-semibold"
            class="mb-8"
            :style="{ color: getColor('textSecondary') }"
          >
            but we know where the available containers are!
          </Typography>
          <Button
            type="button"
            class="w-48"
            @click="router.push({ path: 'dashboard' })"
          >
            Available Containers
          </Button>
        </div>
      </div>
    </div>
  </Main>
</template>

<style lang="scss">
.container-img {
  @media screen and (max-width: 850px) {
    width: 25rem;
  }
}
.content {
  @media screen and (max-width: 755px) {
    align-items: center;
  }
}
</style>

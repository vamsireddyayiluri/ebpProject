<script setup>
import {getColor} from '~/helpers/colors'
import {capitalize} from 'lodash'

const router = useRouter()
const type = ref('exporter')
const userTypes = ref([
  {
    name: 'trucker',
    description: 'Provide an essential service to industrialized societies by transporting finished goods',
  },
  {
    name: 'exporter',
    description: 'Ships goods from his present country to another for the purpose of trade',
  },
])

const onSubmit = () => {
  if (type.value === 'trucker') window.location.href = "https://qualle-stpv2.web.app/street-turns"
  else {
    router.push({name: 'register'})
  }
}
</script>

<template>
  <form
    class="mt-16"
    @submit.prevent="onSubmit"
  >
    <Typography type="text-h1">
      Welcome to Qualle
    </Typography>
    <Typography
      type="text-body-m-regular"
      :color="getColor('textSecondary')"
      class="mt-3 mb-10"
    >
      Choose your business to proceed to registration
    </Typography>
    <div class="max-w-[720px] grid sm:grid-cols-2 grid-cols-1 gap-4 mx-auto mb-10">
      <template
        v-for="i in userTypes"
        :key="i"
      >
        <Card
          elevation="0"
          border
          class="p-6 text-left cursor-pointer"
          tab-index="1"
          :style="{ border: `1px solid ${getColor(type === i.name? 'uiInteractive': 'uiLine')}`}"
          @click="type = i.name"
        >
          <Typography type="text-h2">
            {{ capitalize(i.name) }}
          </Typography>
          <Divider class="my-4" />
          <Typography
            type="text-body-s-regular"
            :color="getColor('textSecondary')"
          >
            {{ i.description }}
          </Typography>
        </Card>
      </template>
    </div>
    <Button
      type="submit"
      class="w-full max-w-[360px]"
    >
      continue
    </Button>
  </form>
</template>

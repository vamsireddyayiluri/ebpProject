<script setup>
import { getColor } from '~/helpers/colors'

const props = defineProps({
  steps: Array,
  activeStep: Number,
  goTo: Function,
})
const emit = defineEmits(['goTo'])
</script>

<template>
  <div class="px-10 mx-auto">
    <div class="d-flex justify-space-between mx-auto position-relative">
      <div
        v-for="(s, id, number) in steps"
        :key="s.step"
        tabindex="0"
        :style="{ cursor: 'pointer', zIndex: 1 }"
        @click="emit('goTo', id)"
        @keydown.enter="emit('goTo', id)"
      >
        <div class="position-relative">
          <Icon
            v-if="activeStep.value > number"
            icon="mdi-check"
            color="white"
            size="16"
            class="rounded-circle mb-2"
            :style="{
              width: '32px',
              height: '32px',
              backgroundColor: getColor('uiInteractive'),
            }"
          />
          <Typography
            v-else
            type="text-body-s-semibold"
            :style="{
              color:
                activeStep.value === number
                  ? getColor('textInteractive-01')
                  : getColor('textSecondary'),
              borderColor:
                activeStep.value === number ? getColor('uiInteractive') : getColor('uiLine'),
            }"
            class="step"
          >
            {{ number + 1 }}
          </Typography>
          <Typography
            type="text-body-s-semibold"
            :style="{
              color:
                activeStep.value === number ? getColor('textPrimary') : getColor('textSecondary'),
            }"
            class="title"
          >
            {{ s.title }}
          </Typography>
        </div>
      </div>
      <div
        class="line"
        :style="{ borderColor: getColor('uiLine') }"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.step {
  width: 32px;
  height: 32px;
  border: 1px solid;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 8px;
  background-color: white;
}
.line {
  width: 100%;
  border-bottom: 1px solid grey;
  position: absolute;
  top: 16px;
  margin: 0 auto;
}
.title {
  position: absolute;
  width: max-content;
  transform: translateX(calc(-50% + 16px));
  z-index: 2000;
  @media screen and (max-width: 960px) {
    width: 100px;
  }
}
</style>

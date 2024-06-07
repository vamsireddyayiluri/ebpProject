<script setup>
import { getColor } from '~/helpers/colors'
const props = defineProps({
  modelValue: {
    type: Number,
    default: () => 0,
    required: true,
  },
  slides: {
    type: Array,
    default: () => [],
    required: true,
  },
})
const emit = defineEmits(['update:modelValue', 'previousSlide', 'nextSlide', 'close'])
const attrs = useAttrs()
const slider = ref(props.modelValue)
const dialog = ref(false)

const updateDialog = e => {
  if (!e) {
    emit('update:modelValue', 0)
    emit('close', e)
    slider.value = 0
  }
  console.log("-> e", e);
}
const previousSlide = () => {
  slider.value -= 1
  emit('previousSlide')
}
const nextSlide = () => {
  slider.value += 1
  emit('nextSlide')
}
defineExpose({
  show: value => {
    dialog.value = value
  },
})
watch(slider, newValue => {
  emit('update:modelValue', newValue)
})
</script>

<template>
  <Dialog
    v-model="dialog"
    max-width="632"
    class="!p-8"
    v-bind="{ ...attrs }"
    @update:modelValue="updateDialog"
  >
    <template #text>
      <Carousel
        v-model="slider"
        hide-delimiters
        :show-arrows="false"
        class="styleCarousel"
      >
        <CarouselItem
          v-for="(slide, i) in slides"
          :key="i"
        >
          <div class="carouselMedia">
            <slot name="media" :props="{...slide}"/>
          </div>
          <div class="carouselContent">
            <div class="carouselControls">
              <Button
                v-if="slider !== 0"
                width="32"
                min-width="32"
                height="32"
                class="mr-auto"
                @click="previousSlide"
              >
                <Icon
                  icon="mdi-chevron-left"
                  :color="getColor('textTertiary')"
                />
              </Button>
              <Button
                v-if="slider !== slides.length - 1"
                width="32"
                min-width="32"
                height="32"
                class="ml-auto"
                @click="nextSlide"
              >
                <Icon
                  icon="mdi-chevron-right"
                  :color="getColor('textTertiary')"
                />
              </Button>
            </div>
            <div class="carouselText">
              <Typography
                v-if="slide.header"
                type="text-h1"
                class="carouselHeader"
              >
                {{ slide.header }}
              </Typography>
              <Typography>
                {{ slide.description }}
              </Typography>
            </div>
          </div>
          <slot />
        </CarouselItem>
      </Carousel>
      <div class="carouselDots">
        <div
          v-for="n in slides.length"
          :key="n"
          class="dot"
          :class="{ active: n === slider + 1 }"
          @click="slider = n - 1"
        >
          <div />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style lang="scss">
.styleCarousel {
  .carouselMedia {
    max-width: 576px;
    min-height: 308px;
    width: 100%;
    border: 1px solid rgba(var(--v-theme-uiLine), 1);
    border-radius: 4px;
  }

  .carouselContent {
    width: 100%;
    margin-top: 32px;
    .carouselText {
      width: calc(100% - 80px);
      margin: 0 auto;
      text-align: center;

      .carouselHeader {
        margin-top: -36px;
        margin-bottom: 16px;
      }
    }

    .carouselControls {
      width: 100%;
      display: flex;
      justify-content: space-between;
    }
  }

  .v-window {
    &-x-transition,
    &-x-reverse-transition,
    &-y-transition,
    &-y-reverse-transition {
      &-enter-active,
      &-leave-active {
        transition: none;
      }
    }
  }

  .v-responsive {
    overflow: visible;
  }

  .styledBtnText {
    .v-icon {
      margin-bottom: 1px;
    }
  }
}

.carouselDots {
  display: flex;
  justify-content: center;
  gap: 12px;

  .dot {
    cursor: pointer;
    padding: 2px;

    div {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      opacity: 0.3;
      background: rgba(var(--v-theme-uiInteractive), 1);
    }
  }

  .active {
    div {
      opacity: 1;
    }
  }
}
</style>

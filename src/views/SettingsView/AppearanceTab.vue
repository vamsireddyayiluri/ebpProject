<script setup>
import { useTheme } from 'vuetify'

const vuetifyTheme = useTheme()
const storage = useStorage('theme')
const radio = ref(storage.value || 'light')
const themes = [
  {
    name: 'light',
    label: 'Light',
  },
  {
    name: 'dark',
    label: 'Dark',
  },
]

watchEffect(() => {
  vuetifyTheme.global.name.value = radio.value
  storage.value = radio.value
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Appearance
  </Typography>
  <RadioGroup
    v-model="radio"
    inline
  >
    <VRow
      no-gutters
      class="gap-6"
    >
      <label
        v-for="t in themes"
        :key="t"
        class="themeItem"
      >
        <div
          class="skeleton"
          :class="{ dark: t.name === 'dark' }"
        >
          <div
            v-for="i in [100, 130, 90]"
            :key="i"
            class="line"
            :style="{ width: i + 'px' }"
          />
        </div>
        <Radio
          :label="t.label"
          :value="t.name"
          class="radioItem"
        />
      </label>
    </VRow>
  </RadioGroup>
</template>

<style lang="scss" scoped>
.themeItem {
  width: 200px;
  height: 182px;
  border-radius: 4px;
  border: 1px solid rgb(var(--v-theme-uiLine));
  .skeleton {
    height: 124px;
    padding: 24px 16px;
    border-radius: 3px 3px 0 0;
    .line {
      height: 10px;
      margin-bottom: 16px;
      border-end-end-radius: 50%;
      border-radius: 12px;
      background-color: rgb(var(--v-theme-uiLine));
    }
  }
  .radioItem {
    width: 100%;
    height: 56px;
    padding-left: 8px;
    border-radius: 0 0 3px 3px;
    border-top: 1px solid rgb(var(--v-theme-uiLine));
    background-color: rgb(var(--v-theme-uiSecondary-02));
  }
  .dark {
    background-color: #1e232c;
    .line {
      background-color: rgb(var(--v-theme-uiLineInteractiveHover));
    }
  }
}
.gap-6 {
  gap: 24px;
}
</style>

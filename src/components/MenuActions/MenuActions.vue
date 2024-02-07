<script setup>
import { getColor } from '~/helpers/colors'

const props = defineProps({
  actions: Function,
  selected: Array,
  container: Object,
  customIcon: String,
  disabled: Boolean,
})
const emit = defineEmits(['containerActionHandler'])

const onAction = (action, e) => {
  emit('containerActionHandler', { action, e })
}
</script>

<template>
  <Menu
    location="bottom end"
    offset="3"
  >
    <template #activator="{ props }">
      <slot>
        <IconButton
          v-bind="props"
          icon="mdi-dots-vertical"
          class="ml-auto -mr-1.5 pointer-events-auto"
          :class="{ 'cursor-not-allowed': disabled }"
          :disabled="disabled"
        />
      </slot>
    </template>
    <List>
      <div v-if="selected.length > 1">
        <div class="flex items-center gap-3 mt-2 mb-4 ml-4">
          <Typography
            type="text-body-s-semibold"
            :color="getColor('textSecondary')"
          >
            Selected
          </Typography>
          <Badge
            v-if="selected.length"
            :color="getColor('uiInteractive')"
            :content="selected.length"
            inline
          />
        </div>
        <Divider class="-mx-2 mb-0.5" />
      </div>
      <ListItem
        v-for="({ action, color, icon, label, customIcon }, n) in actions()"
        :key="n"
        :color="color"
        @click="onAction(action,[container])"
      >
        <template #prepend>
          <template v-if="customIcon">
            <SvgIcon
              :icon="customIcon"
              size="24"
              class="mr-4"
              :color="getColor(color)"
              :hover-color="color"
            />
          </template>
          <template v-else>
            <Icon
              :color="color"
              :icon="icon"
            />
          </template>
        </template>
        <ListItemTitle :color="getColor(color)">
          {{ label }}
        </ListItemTitle>
      </ListItem>
    </List>
  </Menu>
</template>

<script setup>
import {
  Button,
  Divider,
  Header,
  IconButton,
  List,
  ListItem,
  ListItemTitle,
  Select,
  ThemeProvider,
} from '@qualle-admin/qui'

const items = ref([
  {
    name: 'dashboard',
    icon: 'mdi-home',
  },
])
</script>

<template>
  <ThemeProvider>
    <Header :items="items" />
    <VToolbar :color="'uiBackground'">
      <VContainer class="d-flex justify-space-between px-8" fluid>
        <div class="d-flex ml-n4">
          <Menu label="All regions">
            <template #activator="{ props }">
              <Button
                v-bind="props"
                append-icon="mdi-chevron-down"
                variant="text"
              >
                All Regions
              </Button>
            </template>

            <List>
              <ListItem>
                <ListItemTitle> foo </ListItemTitle>
              </ListItem>
            </List>
          </Menu>
          <Divider class="ma-2" vertical />
          <Menu label="By years">
            <template #activator="{ props }">
              <Button
                v-bind="props"
                append-icon="mdi-chevron-down"
                variant="text"
              >
                By years
              </Button>
            </template>

            <List>
              <ListItem>
                <ListItemTitle> foo </ListItemTitle>
              </ListItem>
            </List>
          </Menu>
          <Divider class="ma-2" vertical />
          <div class="d-flex align-center">
            <IconButton icon="mdi-chevron-left" />
            <IconButton icon="mdi-chevron-right" />
            <span>2022</span>
          </div>
        </div>
        <div>
          <Button class="mr-n6" prepend-icon="mdi-map-marker">Map</Button>
        </div>
      </VContainer>
    </VToolbar>
    <Divider class="mb-8" />
    <RouterView />
  </ThemeProvider>
</template>

<style scoped></style>

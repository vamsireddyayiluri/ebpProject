<script setup>
import HelloWorld from './views/HelloWorld.vue'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/png/logo.jpg" style="width: 50%;"/>
  </header>
  <body>
    <div class="wrapper">
      <router-view/>
    </div>
  </body>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

</style>

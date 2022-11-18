<script>
import store from '../store'
import { mapGetters } from 'vuex'

export default {
  name: 'HelloWorld',
  data() {
    return {
      count: 0
    }
  },
  methods: {
    incrementCount() {
      store.dispatch('counter/update_count', this.count + 1);
    },
    decrementCount() {
      store.dispatch('counter/update_count', this.count - 1);
    }
  },
  computed: {
    ...mapGetters('counter',['get_count'])
  },
  watch: {
    get_count(count){
      this.count= count;
    }
  }
}


</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ this.count }}</h1>
    <h3>
      <button @click="incrementCount"> Increment Count </button>
      <br />
      <button @click="decrementCount"> Decrement Count </button>
    </h3>
  </div>
  
  <router-link to="/" class="navbar-brand">Home</router-link>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}
</style>

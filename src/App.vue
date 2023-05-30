<template>
  <div id="app">
    <nav></nav>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'App',
  created() {
    console.log(this)
    console.log(this.$router)
    console.log(this.$route)
  }
})
</script>

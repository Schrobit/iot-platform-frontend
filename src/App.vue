<template>
  <router-view />
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f0f2f5;
}

.mb-4 {
    margin-bottom: 20px;
}

.app-container {
    padding: 20px;
    background-color: #fff;
    min-height: calc(100vh - 84px); /* Approx header height + padding */
}
</style>

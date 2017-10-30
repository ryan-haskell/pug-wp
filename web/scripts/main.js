Vue.directive('fade-image', {
  bind (el, { value }) {
    if (el && value) {
      window.addEventListener('load', function () {
        el.classList.add(value)
      })
    }
  }
})

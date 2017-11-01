Vue.directive('fade-image', {
  bind (el, { value }) {
    if (el) {
      window.addEventListener('load', function () {
        el.classList.add(value || 'image--ready')
      })
    }
  }
})

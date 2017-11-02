Vue.directive('fade-image', {
  bind (el, { value }) {
    if (el) {
      window.addEventListener('load', function () {
        el.classList.add(value || 'image--ready')
      })
    }
  }
})

const Navbar = Vue.component('navbar', {
  data: () => ({
    isMenuOpen: false
  }),
  methods: {
    toggleMenu () {
      this.isMenuOpen = !this.isMenuOpen
    }
  }
})

var vm = new Vue({
  el: '#app',
  components: {
    Navbar
  },
  data: {}
})

const axios = require('axios')
const url = 'http://localhost:8080/wp-json/wp/v2/'

const debug = (prefix) => (thing) => {
  console.log(prefix, thing)
  return thing
}

const error = (prefix) => (reason) => {
  console.error(prefix, reason)
  return reason
}

const filterByIds = (ids, items) =>
  ids
    .map(id => items.filter(item => item.id === id)[0])
    .filter(item => item !== undefined)

const transformLink = (link) => ({
  id: link.id,
  url: link.acf.url,
  icon: link.acf.icon,
  label: link.title.rendered
})

const getProp = (item, props) =>
  props.reduce((obj, prop) =>
    (obj !== undefined) ? obj[prop] : obj
  , item)

const fetchById = (getById) => (props) => (item) =>
  Promise.all(
    getProp(item, props).map(id => getById(id))
  )
    .then(links => ({
      item,
      links
    }))
    .catch(error('fetchById'))

const getLinks = () =>
  axios.get(url + 'links')
    .then(res => res.data
      .map(transformLink)
    )
    .catch(error('getLinks'))

const getLink = (id) =>
  axios.get(url + 'links/' + id)
    .then(res => res.data)
    .then(transformLink)
    .catch(error('getLink'))

const fetchLinks =
    fetchById(getLink)

const getNavbar = (fetchLinks) =>
  axios.get(url + 'navbars')
    .then(res => res.data[0])
    .then(fetchLinks(['acf', 'links']))
    .then(({ item, links }) => ({
      brand: {
        image: item.acf.image,
        alt: item.acf.alt_text
      },
      links
    }))
    .catch(error('getNavbar'))

const getFooter = (fetchLinks) =>
  axios.get(url + 'footers')
    .then(res => res.data[0])
    .then(fetchLinks(['acf', 'links']))
    .then(({ links }) => ({
      links
    }))
    .catch(error('getFooter'))

const getBlogPosts = () =>
  axios.get(url + 'blog-posts')
    .then(res => res.data
      .map(({ id, slug, title, acf }) => ({
        id,
        slug,
        title: title.rendered,
        date: acf.date,
        excerpt: acf.excerpt,
        image: acf.image,
        url: `/blog/${slug}`
      }))
    )
    .catch(error('getBlogPosts'))

const getHomepageSettings = (posts) =>
  axios.get(url + 'homepages')
    .then(res => res.data[0])
    .then(({ acf }) => ({
      meta: {
        title: acf['meta.title'],
        description: acf['meta.description']
      },
      heroSection: {
        title: acf['hero.title'],
        subtitle: acf['hero.subtitle'],
        image: acf['hero.image']
      },
      introSection: {
        header: acf['intro.header'],
        paragraph: acf['intro.paragraph']
      },
      blogSection: {
        header: acf['posts.header'],
        readMoreLabel: acf['posts.button_label'],
        posts: filterByIds(acf['posts.posts'], posts)
      }
    }))
    .catch(error('getHomepageSettings'))

const getSiteSettings = () =>
  Promise.all([
    getNavbar(fetchLinks),
    getFooter(fetchLinks)
  ])
    .then(([ navbar, footer ]) => ({
      navbar,
      footer
    }))
    .catch(error('getSiteSettings'))

const getHomepage = () =>
  getBlogPosts()
    .then(getHomepageSettings)
    .catch(error('getHomepage'))

module.exports = {
  getSiteSettings,
  getHomepage
}

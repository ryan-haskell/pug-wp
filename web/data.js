const axios = require('axios')
const url = 'http://localhost:8080/wp-json/wp/v2/'

// const debug = (prefix) => (thing) => {
//   console.log(prefix, thing)
//   return thing
// }

const grabAll = (res) => res.data

const grabFirst = (res) => res.data[0]

const map = (fn) => (list) => list.map(fn)

const error = (prefix) => (reason) => {
  console.error(prefix, reason)
  return reason
}

const separateUnitsWithDash = (date) =>
  date.split('').map((num, i) => (i === 4 || i === 6) ? `-${num}` : num ).join('')

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'Novmeber', 'December']

// 20151115
const formatDate = (wpDate) => {
  const date = new Date(separateUnitsWithDash(wpDate))
  const month = months[date.getMonth()]
  const dayOfMonth = date.getDate()
  const year = date.getFullYear()
  return `${month} ${dayOfMonth}, ${year}`
}

const transformLink = (link) => ({
  id: link.id,
  url: link.acf.url,
  icon: link.acf.icon,
  label: link.title.rendered
})

const populateLinks = (prop) => (item) =>
  Promise.all(item.acf[prop].map(id =>
    axios.get(url + 'links/' + id).then(res => res.data)
  ))
    .then((links) => {
      item.acf[prop] = links.map(transformLink)
      return item
    })
    .catch(error('populateLinks'))

const getGlobalSettings = () =>
  axios.get(url + 'global-settings?per_page=1')
    .then(grabFirst)
    .then(({ acf }) => ({
      readMoreLabel: acf.readMoreLabel
    }))

const getNavbar = () =>
  axios.get(url + 'navbar?per_page=1')
    .then(grabFirst)
    .then(populateLinks('links'))
    .then(({ acf }) => ({
      brand: {
        image: acf['logo.image'],
        altText: acf['logo.altText']
      },
      links: acf.links
    }))
    .catch(error('getNavbar'))

const getFooter = () =>
  axios.get(url + 'footers?per_page=1')
    .then(grabFirst)
    .then(populateLinks('links'))
    .then(({ acf }) => ({
      links: acf.links
    }))
    .catch(error('getFooter'))

const transformBlogPost = ({ id, slug, title, acf }) => ({
  id,
  slug,
  title: title.rendered,
  date: formatDate(acf.date),
  excerpt: acf.excerpt,
  content: acf.content,
  image: acf.image,
  url: `/blog/${slug}`
})

const getLatestBlogPosts = (limit) =>
    axios.get(url + 'blog-posts?order=asc&per_page=' + limit)
      .then(grabAll)
      .then(map(transformBlogPost))
      .catch(error('getLatestBlogPosts'))

const getBlogPost = (slug) =>
  axios.get(url + 'blog-posts?slug=' + slug)
    .then(grabFirst)
    .then(transformBlogPost)
    .catch(error('getBlogPost'))

const mapMeta = (acf) => ({
  title: acf['meta.title'],
  description: acf['meta.description'],
  keywords: []
})

const mapHero = (acf) => ({
  title: acf['hero.title'],
  image: {
    url: acf['hero.image'],
    altText: 'Todo'
  }
})

const getHomepageSettings = (latestPosts) =>
  axios.get(url + 'homepages?per_page=1')
    .then(grabFirst)
    .then(({ acf }) => ({
      meta: mapMeta(acf),
      heroSection: mapHero(acf),
      introSection: {
        header: acf['intro.header'],
        paragraph: acf['intro.content']
      },
      blogSection: {
        header: acf['posts.header'],
        posts: latestPosts
      }
    }))
    .catch(error('getHomepageSettings'))

const getBlogLandingSettings = (latestPosts) =>
  axios.get(url + 'blog-landing-settings?per_page=1')
    .then(grabFirst)
    .then(({ acf }) => ({
      meta: mapMeta(acf),
      heroSection: mapHero(acf),
      latestPosts
    }))
    .catch(error('getBlogLandingSettings'))

const getBlogDetailPageSettings = () =>
  axios.get(url + 'blog-detail-settings?per_page=1')
    .then(grabFirst)
    .catch(error('getBlogDetailPageSettings'))

const getAboutPageSettings = () =>
  axios.get(url + 'about-us-settings?per_page=1')
    .then(grabFirst)
    .then(({ acf }) => ({
      meta: mapMeta(acf),
      heroSection: mapHero(acf)
    }))
    .catch(error('getAboutPageSettings'))

const getSiteSettings = () =>
  Promise.all([
    getGlobalSettings(),
    getNavbar(),
    getFooter()
  ])
    .then(([ general, navbar, footer ]) => ({
      general,
      navbar,
      footer
    }))
    .catch(error('getSiteSettings'))

const getHomepage = () =>
  getLatestBlogPosts(3)
    .then(getHomepageSettings)
    .catch(error('getHomepage'))

const getBlogLandingPage = () =>
  getLatestBlogPosts(5)
    .then(getBlogLandingSettings)
    .catch(error('getBlogLandingPage'))

const getBlogDetailPage = (id) =>
  Promise.all([
    getBlogDetailPageSettings(),
    getBlogPost(id)
  ])
    .then(([ settings, post ]) => ({
      settings,
      post,
      meta: {
        title: mapMeta(settings.acf).title
          .split('{{title}}').join(post.title),
        description: mapMeta(settings.acf).description
          .split('{{excerpt}}').join(post.excerpt)
      }
    }))
    .catch(error('getBlogDetailPage'))

const getAboutPage = () =>
  getAboutPageSettings()
    .catch(error('getAboutPage'))

module.exports = {
  getSiteSettings,
  getHomepage,
  getBlogLandingPage,
  getBlogDetailPage,
  getAboutPage
}

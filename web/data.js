const axios = require('axios')
const url = 'http://localhost:8080/wp-json/wp/v2/'

// const debug = (prefix) => (thing) => {
//   console.log(prefix, thing)
//   return thing
// }

const error = (prefix) => (reason) => {
  console.error(prefix, reason)
  return reason
}

const transformLink = (link) => ({
  id: link.id,
  url: link.acf.url,
  icon: link.acf.icon,
  label: link.title.rendered
})

const getNavbar = () =>
  axios.get(url + 'navbars?per_page=1')
    .then(res => res.data[0])
    .then(({ acf }) => ({
      brand: {
        image: acf['image.url'],
        altText: acf['image.altText']
      },
      links: acf.links.map(transformLink)
    }))
    .catch(error('getNavbar'))

const getFooter = () =>
  axios.get(url + 'footers?per_page=1')
    .then(res => res.data[0])
    .then(({ acf }) => ({
      links: acf.links.map(transformLink)
    }))
    .catch(error('getFooter'))

const transformBlogPost = ({ id, slug, title, acf }) => ({
  id,
  slug,
  title: title.rendered,
  date: acf.date,
  excerpt: acf.content.substring(0, 125) + '...',
  content: acf.content,
  image: acf.image,
  url: `/blog/${slug}`
})

const getLatestBlogPosts = (limit) =>
    axios.get(url + 'blog-posts?order=asc&per_page=' + limit)
      .then(res => res.data.map(transformBlogPost))
      .catch(error('getLatestBlogPosts'))

const getBlogPost = (slug) =>
  axios.get(url + 'blog-posts?slug=' + slug)
    .then(res => res.data[0])
    .then(transformBlogPost)
    .catch(error('getBlogPost'))

const mapMeta = (acf) => ({
  title: acf['meta.title'],
  description: acf['meta.description']
})

const mapHero = (acf) => ({
  title: acf['hero.header'],
  image: acf['hero.image']
})

const getHomepageSettings = (latestPosts) =>
  axios.get(url + 'homepages?per_page=1')
    .then(res => res.data[0])
    .then(({ acf }) => ({
      meta: mapMeta(acf),
      heroSection: mapHero(acf),
      introSection: {
        header: acf['intro.header'],
        paragraph: acf['intro.paragraph']
      },
      blogSection: {
        header: acf['posts.header'],
        posts: latestPosts
      }
    }))
    .catch(error('getHomepageSettings'))

const getBlogLandingSettings = (latestPosts) =>
  axios.get(url + 'blog-landing-settings?per_page=1')
    .then(res => res.data[0])
    .then(({ acf }) => ({
      meta: mapMeta(acf),
      heroSection: mapHero(acf),
      latestPosts
    }))
    .catch(error('getBlogLandingSettings'))

const getBlogDetailPageSettings = () =>
  axios.get(url + 'blog-detail-settings?per_page=1')
    .then(res => res.data[0])
    .catch(error('getBlogDetailPageSettings'))

const getAboutPageSettings = () =>
  axios.get(url + 'about-us-settings?per_page=1')
    .then(res => res.data[0])
    .then(({ acf }) => ({
      meta: mapMeta(acf),
      heroSection: mapHero(acf)
    }))
    .catch(error('getAboutPageSettings'))

const getSiteSettings = () =>
  Promise.all([
    getNavbar(),
    getFooter()
  ])
    .then(([ navbar, footer ]) => ({
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

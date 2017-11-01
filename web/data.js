const axios = require('axios')
const url = 'http://cms/wp-json/wp/v2/'

// const debug = (prefix) => (thing) => {
//   console.log(prefix, thing)
//   return thing
// }

const grabAll = (res) =>
  (res && res.data)
    ? Promise.resolve(res.data)
    : Promise.reject(new Error('Could not grab all results.'))

const grabFirst = (res) =>
  (res && res.data && res.data[0])
    ? Promise.resolve(res.data[0])
    : Promise.reject(new Error('Could not grab first result.'))

const map = (fn) => (list) => list.map(fn)

const error = (prefix) => (reason) => {
  console.error(prefix, reason)
  return reason
}

const rejectWithError = (prefix) => (reason) =>
  Promise.reject(error(prefix)(reason))

const separateUnitsWithDash = (date) =>
  date.split('').map((num, i) => (i === 4 || i === 6) ? `-${num}` : num).join('')

// const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'Novmeber', 'December']

// 20151115 --> 2015-11-15
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

const transformSection = ({ title, slug, acf }) => ({
  title: title.rendered,
  slug,
  meta: {
    title: title.rendered,
    description: acf.description
  },
  content: acf.content
})

const populateLinks = (prop) => (item) =>
  Promise.all(item.acf[prop].map(id =>
    axios.get(url + 'links/' + id).then(res => res.data)
  ))
    .then((links) => {
      item.acf[prop] = links.map(transformLink)
      return item
    })
    .catch(rejectWithError('populateLinks'))

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
    .catch(rejectWithError('getNavbar'))

const getFooter = () =>
  axios.get(url + 'footers?per_page=1')
    .then(grabFirst)
    .then(populateLinks('links'))
    .then(({ acf }) => ({
      links: acf.links
    }))
    .catch(rejectWithError('getFooter'))

const transformBlogPost = ({ id, slug, title, acf }) => ({
  id,
  slug,
  title: title.rendered,
  date: formatDate(acf.date),
  excerpt: acf.excerpt,
  content: acf.content,
  image: {
    url: acf.image,
    // TODO: Alt text
    altText: 'Post preview image'
  },
  url: `/blog/${slug}`
})

const getLatestBlogPosts = (limit) =>
  axios.get(`${url}blog-posts?order=asc&per_page=${limit}`)
    .then(grabAll)
    .then(map(transformBlogPost))
    .catch(rejectWithError('getLatestBlogPosts'))

const getBlogPost = (slug) =>
  axios.get(`${url}blog-posts?slug=${slug}&per_page=1`)
    .then(grabFirst)
    .then(transformBlogPost)
    .then((post) => ({
      ...post,
      meta: {
        title: post.title,
        description: post.description
      }
    }))
    .catch(rejectWithError('getBlogPost'))

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

const getHomepageSettings = () =>
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
        header: acf['latestPosts.header'],
        posts: []
      }
    }))
    .catch(rejectWithError('getHomepageSettings'))

const getBlogLandingSettings = () =>
  axios.get(url + 'blog-landing-settings?per_page=1')
    .then(grabFirst)
    .then(({ acf }) => ({
      meta: mapMeta(acf),
      heroSection: mapHero(acf)
    }))
    .catch(rejectWithError('getBlogLandingSettings'))

const filterByIds = (ids) => (posts) =>
    posts.filter(post => ids.indexOf(post.id) !== -1)

const getGeneralSections = (page, sectionIds) =>
  axios.get(`${url}sections/${page}`)
    .then(grabAll)
    .then(filterByIds(sectionIds))
    .then(map(transformSection))
    .catch(rejectWithError('getGeneralSections'))

const getGeneralPageSettings = (pageName) =>
  axios.get(`${url}general-pages?slug=${pageName}&per_page=1`)
    .then(grabFirst)
    .then(page => Promise.all([
      Promise.resolve(page),
      getGeneralSections(pageName, page.acf.sections)
    ]))
    .then(([{ title, acf }, sections]) => ({
      title: title.rendered,
      meta: {
        title: title.rendered,
        description: acf.description
      },
      heroSection: {
        ...mapHero(acf),
        title: title.rendered
      },
      content: acf.content,
      sections
    }))
    .catch(rejectWithError(`getGeneralPageSettings: ${pageName}`))

const getGeneralSectionSettings = (page, section) =>
  axios.get(`${url}sections/${page}?slug=${section}&per_page=1`)
    .then(grabFirst)
    .then(transformSection)
    .catch(rejectWithError(`getGeneralSectionSettings: ${page}, ${section}`))

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
    .catch(rejectWithError('getSiteSettings'))

const getHomepage = () =>
  Promise.all([
    getLatestBlogPosts(3),
    getHomepageSettings()
  ])
    .then(([ latestPosts, page ]) => ({
      ...page,
      blogSection: {
        header: page.blogSection.header,
        posts: latestPosts
      }
    }))
    .catch(rejectWithError('getHomepage'))

const getBlogLandingPage = () =>
    Promise.all([
      getLatestBlogPosts(5),
      getBlogLandingSettings()
    ])
    .then(([ latestPosts, page ]) => ({
      ...page,
      latestPosts
    }))
    .catch(rejectWithError('getBlogLandingPage'))

const getBlogDetailPage = (id) =>
  getBlogPost(id)
    .catch(rejectWithError('getBlogDetailPage'))

const getGeneralPage = (page) =>
  getGeneralPageSettings(page)
    .catch(rejectWithError(`getGeneralPage: ${page}`))

const getGeneralSection = (page, section) =>
  getGeneralSectionSettings(page, section)
    .catch(rejectWithError(`getGeneralSection: ${page}/${section}`))

module.exports = {
  getSiteSettings,
  getHomepage,
  getBlogLandingPage,
  getBlogDetailPage,
  getGeneralPage,
  getGeneralSection
}

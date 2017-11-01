const {
  getSiteSettings,
  getHomepage,
  getBlogDetailPage,
  getBlogLandingPage,
  getGeneralPage,
  getGeneralSection
} = require('./data')

module.exports = (app) => {
  const render = (res, page, locals) =>
    res.render(`pages/${page}`, Object.assign(locals, app.get('pug options')))

  const renderPage = (res, pageFilename) => ([ site, page ]) =>
    render(res, pageFilename, { site, page })

  const renderErrorPage = (res) => (reason) => {
    res.status(500)
    render(res, 'error', { reason: JSON.stringify(reason) })
  }

  const renderNotFoundPage = (res) => (reason) =>
    render(res, 'not-found', { reason: JSON.stringify(reason) })

  return {

    home: (req, res) =>
      Promise.all([
        getSiteSettings(),
        getHomepage()
      ])
        .then(renderPage(res, 'home'))
        .catch(renderErrorPage(res)),

    blog: {

      landing: (req, res) =>
        Promise.all([
          getSiteSettings(),
          getBlogLandingPage()
        ])
          .then(renderPage(res, 'blog/landing'))
          .catch(renderErrorPage(res)),

      detail: (slug) => (req, res) =>
        Promise.all([
          getSiteSettings(),
          getBlogDetailPage(req.params[slug])
        ])
          .then(renderPage(res, 'blog/detail'))
          .catch(renderNotFoundPage(res))

    },

    page: (page) => (req, res) =>
      Promise.all([
        getSiteSettings(),
        getGeneralPage(req.params[page])
      ])
        .then(renderPage(res, 'page'))
        .catch(renderNotFoundPage(res)),

    section: (page, section) => (req, res) =>
      Promise.all([
        getSiteSettings(),
        getGeneralSection(req.params[page], req.params[section])
      ])
        .then(renderPage(res, 'section'))
        .catch(renderNotFoundPage(res)),

    notFound: (req, res) =>
      renderNotFoundPage(res)(),

    error: (err, req, res, next) =>
      renderErrorPage(res)(err)

  }
}

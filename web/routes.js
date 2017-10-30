const {
  getSiteSettings,
  getHomepage,
  getBlogDetailPage,
  getBlogLandingPage,
  getAboutPage
} = require('./data')

module.exports = (app) => {
  const render = (res, page, locals) =>
    res.render(`pages/${page}`, Object.assign(locals, app.get('pug options')))

  return {

    home: (req, res) =>
      Promise.all([
        getSiteSettings(),
        getHomepage()
      ])
        .then(([ site, page ]) =>
          render(res, 'home', {
            site,
            page
          })
        ),

    blog: {

      landing: (req, res) =>
        Promise.all([
          getSiteSettings(),
          getBlogLandingPage()
        ])
          .then(([ site, page ]) =>
            render(res, 'blog/landing', {
              site,
              page
            })
          ),

      detail: (req, res) =>
        Promise.all([
          getSiteSettings(),
          getBlogDetailPage(req.params.slug)
        ])
          .then(([ site, page ]) =>
            render(res, 'blog/detail', {
              site,
              page
            })
          )

    },

    aboutUs: (req, res) =>
      Promise.all([
        getSiteSettings(),
        getAboutPage()
      ])
        .then(([ site, page ]) =>
          render(res, 'about-us', {
            site,
            page
          })
        )

  }
}

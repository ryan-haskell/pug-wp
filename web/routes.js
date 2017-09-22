const { getSiteSettings, getHomepage } = require('./data')

module.exports = (app) => ({
  home: (req, res) =>
    Promise.all([
      getSiteSettings(),
      getHomepage()
    ])
      .then(([site, page]) =>
        res.render('pages/home', {
          basedir: app.get('basedir'),
          site,
          page
        })
      )
})

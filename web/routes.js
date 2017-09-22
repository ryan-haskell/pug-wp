const { getSiteSettings, getHomepage } = require('./data')

const setKeysFrom = (someObj) => (obj, key) => {
  obj[key] = someObj[key]
  return obj
}

const shallowClone = (obj) =>
  Object.keys(obj).reduce(setKeysFrom(obj), {})

const extendObject = (obj1, obj2) =>
  Object.keys(obj2).reduce(setKeysFrom(obj2), shallowClone(obj1))

module.exports = (app) => {
  const render = (res, page, locals) =>
    res.render(`pages/${page}`, extendObject(app.get('pug options'), locals))

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
        )
  }
}

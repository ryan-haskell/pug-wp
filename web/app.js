const express = require('express')
const morgan = require('morgan')

// Configuration
const { port } = {
  port: process.env.PORT || 3000
}

// App setup
const app = express()
app.use(morgan('tiny'))
app.set('view engine', 'pug')
app.set('pug options', {
  basedir: './views',
  pretty: process.env.NODE_ENV !== 'production'
})

// Routes
const routes = require('./routes')(app)

app.get('/', routes.home)

// Start web server
app.listen(port, () => console.info(`Ready at http://localhost:${port}`))

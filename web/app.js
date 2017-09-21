const express = require('express')
const morgan = require('morgan')
const axios = require('axios')

const { port } = {
  port: process.env.PORT || 3000
}

const app = express()
app.use(morgan('tiny'))
app.set('view engine', 'pug')
app.set('basedir', './views')

const routes = require('./routes')(app)

app.get('/', routes.home)

app.listen(port, () => console.info(`Ready at http://localhost:${port}`))

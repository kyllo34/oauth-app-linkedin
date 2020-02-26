// Third-party resources
const path = require('path')
const cors = require('cors')
const morgan = require('morgan')
const express = require('express');

// Prepare the express app
const secureExpress = require('https-localhost');
const app = secureExpress();

// App-level middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
// app.serve('public');
app.use(express.static(path.join(__dirname, 'public')))

// Routes
const authRouter = require('./routes/authRouter')
app.use(authRouter)

// Catch-alls
const notFound = require('./middleware/notFound')
app.use(notFound)
const errorHandler = require('./middleware/errorHandler')
app.use(errorHandler)

// Export the server and a start method
module.exports = {
  server: app,
  start: port => {
    app.listen(port, () => {
      console.log(`Express server listening on port ${port}.`)
    })
  }
}

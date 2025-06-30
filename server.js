const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

console.log(`Starting server in ${dev ? 'development' : 'production'} mode`)
console.log(`Binding to ${hostname}:${port}`)

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  server.once('error', (err) => {
    console.error('Server error:', err)
    process.exit(1)
  })

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}) 
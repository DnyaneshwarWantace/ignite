// Set NODE_ENV to production explicitly for Render
process.env.NODE_ENV = 'production'

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const port = parseInt(process.env.PORT || '3000', 10)
const hostname = '0.0.0.0'

console.log(`Starting production server on ${hostname}:${port}`)
console.log(`Environment: ${process.env.NODE_ENV || 'production'}`)

const app = next({ 
  dev: false,
  hostname,
  port,
  conf: {
    // Disable middleware in production to avoid eval errors
    experimental: {
      middlewareSourceMap: false,
    }
  }
})

const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
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
    console.log(`✅ Server ready on http://${hostname}:${port}`)
    console.log(`✅ Accepting connections on all interfaces`)
  })

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
}) 
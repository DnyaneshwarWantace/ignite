// Force production environment
process.env.NODE_ENV = 'production';

// Get port from environment or default to 3000
const port = process.env.PORT || 3000;

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const hostname = '0.0.0.0';

console.log(`Starting production server on ${hostname}:${port}`);
console.log(`Environment: ${process.env.NODE_ENV}`);

const app = next({ 
  dev: false,
  hostname,
  port,
  conf: {
    // Ensure production settings
    compress: true,
    poweredByHeader: false,
    generateEtags: true
  }
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  server.once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  // Bind to all interfaces
  server.listen(port, hostname, () => {
    console.log(`✅ Server ready on http://${hostname}:${port}`);
    console.log('✅ Accepting connections on all interfaces');
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}); 
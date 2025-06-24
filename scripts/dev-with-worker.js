const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting development server with automatic media processing...\n');

// Colors for output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

// Start Next.js dev server (use dev:next-only to avoid recursive calls)
const nextProcess = spawn('npm', ['run', 'dev:next-only'], {
  stdio: 'pipe',
  shell: true,
  cwd: process.cwd()
});

// Start media worker after a small delay to let Next.js start first
setTimeout(() => {
  console.log(`${colors.green}🔄 Starting Media Worker...${colors.reset}\n`);
  
  const workerProcess = spawn('node', ['scripts/media-worker.js'], {
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd()
  });

  // Handle worker output
  workerProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${colors.cyan}[MEDIA-WORKER]${colors.reset} ${output}`);
    }
  });

  workerProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(`${colors.yellow}[MEDIA-WORKER ERROR]${colors.reset} ${output}`);
    }
  });

  workerProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[MEDIA-WORKER]${colors.reset} Process exited with code ${code}`);
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}🛑 Shutting down processes...${colors.reset}`);
    workerProcess.kill('SIGINT');
    nextProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(`\n${colors.yellow}🛑 Shutting down processes...${colors.reset}`);
    workerProcess.kill('SIGTERM');
    nextProcess.kill('SIGTERM');
    process.exit(0);
  });

}, 3000); // Wait 3 seconds for Next.js to start

// Handle Next.js output
nextProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`${colors.blue}[NEXT.JS]${colors.reset} ${output}`);
  }
});

nextProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.error(`${colors.red}[NEXT.JS ERROR]${colors.reset} ${output}`);
  }
});

nextProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`${colors.red}[NEXT.JS]${colors.reset} Process exited with code ${code}`);
  }
  process.exit(code);
});

// Handle graceful shutdown for Next.js
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}🛑 Shutting down Next.js...${colors.reset}`);
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}🛑 Shutting down Next.js...${colors.reset}`);
  nextProcess.kill('SIGTERM');
});

console.log(`${colors.green}✅ Development environment started!${colors.reset}`);
console.log(`${colors.blue}📱 Next.js dev server starting...${colors.reset}`);
console.log(`${colors.cyan}🔄 Media worker will start in 3 seconds...${colors.reset}`);
console.log(`${colors.yellow}💡 Press Ctrl+C to stop both processes${colors.reset}\n`);
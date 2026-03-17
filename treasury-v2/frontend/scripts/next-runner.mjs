import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';

const [command, ...cliArgs] = process.argv.slice(2);

if (!command) {
  console.error('Missing Next.js command. Use: dev, build, or start.');
  process.exit(1);
}

const nextBin = path.resolve(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const supportsPort = command === 'dev' || command === 'start';
const explicitPort = readPortArg(cliArgs);
const preferredPort = readPortFromEnv() ?? 3000;

const run = async () => {
  const args = [nextBin, command, ...cliArgs];

  if (supportsPort && explicitPort === null) {
    const port = await choosePort(preferredPort);
    args.push('--port', String(port));

    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy. Starting frontend on port ${port} instead.`);
    }
  }

  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

function readPortArg(args) {
  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (current === '--port' || current === '-p') {
      return parsePort(args[index + 1]);
    }

    if (current.startsWith('--port=')) {
      return parsePort(current.slice('--port='.length));
    }
  }

  return null;
}

function readPortFromEnv() {
  return parsePort(process.env.PORT);
}

function parsePort(value) {
  if (!value) {
    return null;
  }

  const port = Number.parseInt(String(value), 10);
  if (!Number.isInteger(port) || port <= 0) {
    return null;
  }

  return port;
}

async function choosePort(preferredPort) {
  if (await isPortFree(preferredPort)) {
    return preferredPort;
  }

  const fallbackPorts = [];
  const startPort = preferredPort === 3000 ? 3002 : preferredPort + 1;
  for (let port = startPort; port < preferredPort + 20; port += 1) {
    fallbackPorts.push(port);
  }

  for (const port of fallbackPorts) {
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error(`No free frontend port found between ${preferredPort} and ${preferredPort + 19}.`);
}

function isPortFree(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

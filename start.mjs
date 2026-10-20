/**
 * Secuencia unificada de inicio para Proformas Instalaciones (Backend + Frontend)
 * Uso: node start.mjs
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backDir = path.join(__dirname, 'back');
const frontDir = path.join(__dirname, 'front');

function log(tag, color, msg) {
  const lines = String(msg).replace(/\r?\n$/, '').split(/\r?\n/);
  for (const line of lines) {
    if (line.trim()) {
      console.log(`\x1b[${color}m[${tag}]\x1b[0m ${line}`);
    }
  }
}

function waitForHealth(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            res.resume();
            resolve(true);
          } else {
            res.resume();
            retry();
          }
        })
        .on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Tiempo de espera agotado esperando ${url}`));
      } else {
        setTimeout(check, 250);
      }
    };
    check();
  });
}

async function main() {
  console.log('\x1b[1;36m============================================================\x1b[0m');
  console.log('\x1b[1;36m   PROFORMAS INSTALACIONES — Secuencia de Inicio Completa   \x1b[0m');
  console.log('\x1b[1;36m============================================================\x1b[0m');

  // Paso 1: Iniciar Backend
  log('SEQ', '33', 'Paso 1/2: Iniciando servidor API Backend en puerto 8080...');
  const backProc = spawn(process.execPath, ['dev-server.mjs'], {
    cwd: backDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backProc.stdout.on('data', (d) => log('BACK', '32', d));
  backProc.stderr.on('data', (d) => log('BACK', '31', d));

  await waitForHealth('http://localhost:8080/api/v1/health');
  log('SEQ', '32', '✔ Backend API operativo en http://localhost:8080/api/v1');

  // Paso 2: Iniciar Frontend (Vite)
  log('SEQ', '33', 'Paso 2/2: Iniciando servidor Frontend (Vite) en puerto 5173...');
  const viteBin = path.join(frontDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const frontProc = spawn(process.execPath, [viteBin, '--port', '5173'], {
    cwd: frontDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  frontProc.stdout.on('data', (d) => log('FRONT', '36', d));
  frontProc.stderr.on('data', (d) => log('FRONT', '31', d));

  await waitForHealth('http://localhost:5173');
  log('SEQ', '32', '✔ Frontend operativo en http://localhost:5173/');

  console.log('\x1b[1;32m------------------------------------------------------------\x1b[0m');
  console.log('\x1b[1;32m 🚀 Sistema listo: http://localhost:5173/                   \x1b[0m');
  console.log('\x1b[1;32m    Presione Ctrl+C para detener ambos servidores.          \x1b[0m');
  console.log('\x1b[1;32m------------------------------------------------------------\x1b[0m');

  const shutdown = () => {
    log('SEQ', '33', 'Deteniendo servidores (Frontend y Backend)...');
    frontProc.kill();
    backProc.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('\x1b[31m[ERROR]\x1b[0m', err.message);
  process.exit(1);
});

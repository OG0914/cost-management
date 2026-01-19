import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

function parseDotenv(content) {
  const env = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex < 0) continue

    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if (!key) continue
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function readDotenv(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {}
    return parseDotenv(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return {}
  }
}

function toPort(value, fallback) {
  const port = Number(value)
  return Number.isFinite(port) && port > 0 ? port : fallback
}

function normalizeBackendHost(host) {
  const h = String(host || '').trim()
  if (!h || h === '0.0.0.0' || h === '::') return 'localhost'
  return h
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')

  const backendEnv = {
    ...readDotenv(resolve(__dirname, '../backend/.env.example')),
    ...readDotenv(resolve(__dirname, '../backend/.env'))
  }

  const backendPort = toPort(backendEnv.PORT, 3000)
  const backendHost = normalizeBackendHost(backendEnv.HOST)
  const apiTarget = env.VITE_API_URL || `http://${backendHost}:${backendPort}`

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      host: env.VITE_DEV_HOST || '0.0.0.0', // 允许局域网访问
      port: toPort(env.VITE_DEV_PORT, 5173),
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  }
})

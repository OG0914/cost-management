/**
 * 统一日志工具 - 生产环境自动禁用 console 输出
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args) => isDev && console.log('[LOG]', ...args),
  info: (...args) => isDev && console.info('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => isDev && console.debug('[DEBUG]', ...args)
}

export default logger

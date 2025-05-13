const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  debug: (...args) => {
    if (isDev) {
      console.debug('[DEBUG]', ...args)
    }
  },
  info: (...args) => console.info('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  request: (req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      const { method, originalUrl, ip } = req
      const { statusCode } = res
      const userAgent = req.get('user-agent') || ''
      logger.info(`${method} ${originalUrl} ${statusCode} ${duration}ms | ${ip} | ${userAgent}`)
    })
    next()
  }
}

export default logger 
import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  name: 'prompthub',
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  redact: {
    paths: ['req.headers.authorization', 'request.headers.authorization', 'user.email', 'data.ip', 'data.ipHash'],
    remove: true,
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        },
      }
    : undefined,
})

export type Logger = typeof logger

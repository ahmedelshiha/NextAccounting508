export function getSystemStatus(env: NodeJS.ProcessEnv = process.env) {
  const hasDb = Boolean(env.NETLIFY_DATABASE_URL)
  const hasNextAuthUrl = Boolean(env.NEXTAUTH_URL)
  const hasNextAuthSecret = Boolean(env.NEXTAUTH_SECRET)
  const nodeEnv = env.NODE_ENV || 'development'

  return {
    database: hasDb,
    authentication: {
      url: hasNextAuthUrl,
      secret: hasNextAuthSecret,
    },
    environment: {
      nodeEnv,
      databaseConfigured: hasDb,
    },
  }
}

export default getSystemStatus

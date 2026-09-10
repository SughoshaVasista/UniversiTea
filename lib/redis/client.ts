import { createClient } from 'redis'

export type RedisClient = ReturnType<typeof createClient>

let client: RedisClient | null = null
let connectPromise: Promise<RedisClient | null> | null = null

export async function getRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL
  if (!url) return null

  if (client?.isReady) return client
  if (connectPromise) return connectPromise

  client = createClient({ url })
  client.on('error', (error) => console.error('[redis]', error))
  connectPromise = client.connect()
    .then(() => client)
    .catch((error) => {
      console.error('[redis] connection failed', error)
      client = null
      return null
    })
    .finally(() => {
      connectPromise = null
    })

  return connectPromise
}

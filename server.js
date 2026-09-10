/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { createAdapter } = require('@socket.io/redis-adapter')
const { createClient } = require('redis')
const { PrismaClient } = require('@prisma/client')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.APP_HOSTNAME || 'localhost'
const port = Number(process.env.PORT || 3000)
const prisma = new PrismaClient()

function getCookie(cookieHeader, name) {
  const match = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    if (!dev) {
      throw new Error('REDIS_URL is required for horizontally scalable realtime events')
    }
    console.warn('REDIS_URL is not set; starting single-instance realtime in development')
  }

  let pubClient
  let subClient
  if (redisUrl) {
    pubClient = createClient({ url: redisUrl })
    subClient = pubClient.duplicate()
    pubClient.on('error', (error) => console.error('[redis:pub]', error))
    subClient.on('error', (error) => console.error('[redis:sub]', error))
    await Promise.all([pubClient.connect(), subClient.connect()])
  }

  // Attach Socket.io and share rooms/events across every app instance.
  const io = new Server(server)
  if (pubClient && subClient) io.adapter(createAdapter(pubClient, subClient))

  // API routes use this process-local handle to emit; the Redis adapter forwards
  // those events to sockets connected to every other app instance.
  global.io = io

  if (pubClient) {
    const { startVoteDeltaWorker } = require('./workers/voteDeltaWorker')
    startVoteDeltaWorker(pubClient)
  }

  io.use(async (socket, next) => {
    try {
      const sessionId = getCookie(socket.handshake.headers.cookie, 'universitea_session')
      if (!sessionId) return next()

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { expiresAt: true, user: { select: { id: true, accountStatus: true } } },
      })

      if (session && session.expiresAt >= new Date() && session.user.accountStatus === 'ACTIVE') {
        socket.data.userId = session.user.id
      }
      next()
    } catch (error) {
      console.error('[socket:auth]', error)
      next()
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // A client requests to subscribe to a user's private notification channel
    socket.on('subscribe_user', (userId, acknowledge) => {
      const reply = typeof acknowledge === 'function' ? acknowledge : () => {}
      if (!socket.data.userId || socket.data.userId !== userId) {
        reply({ ok: false, error: 'Unauthorized user subscription' })
        socket.emit('subscription_error', { channel: 'user', error: 'Unauthorized user subscription' })
        return
      }

      socket.join(`user_${userId}`)
      reply({ ok: true })
      console.log(`Socket ${socket.id} joined user_${userId}`)
    })

    // A client requests to subscribe to a specific community's events (e.g. new posts)
    socket.on('subscribe_community', (communityId) => {
      socket.join(`community_${communityId}`)
      console.log(`Socket ${socket.id} joined community_${communityId}`)
    })

    // A client requests to subscribe to a specific post's events (e.g. comments, votes)
    socket.on('subscribe_post', (postId) => {
      socket.join(`post_${postId}`)
      console.log(`Socket ${socket.id} joined post_${postId}`)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})

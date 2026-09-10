const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
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

  // Attach Socket.io
  const io = new Server(server)

  // Make io available globally so our API routes or services can access it
  // This is a bit hacky but works for local dev/single instance deployments.
  global.io = io

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // A client requests to subscribe to a user's private notification channel
    socket.on('subscribe_user', (userId) => {
      // In a real app we'd verify the JWT/session here before joining!
      // For MVP, we trust the client to just provide its own ID.
      socket.join(`user_${userId}`)
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

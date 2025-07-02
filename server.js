const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const connectDB = require("./src/config/database")
const { createServer } = require("http")
const { Server } = require("socket.io")
const path = require("path")
const jwt = require("jsonwebtoken")
const fs = require('fs');
// Load environment variables
dotenv.config()

// Connect to database
connectDB()

const app = express()
const server = createServer(app)

// Increase EventEmitter max listeners
require("events").EventEmitter.defaultMaxListeners = 20

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true,
}

// Socket.IO setup with proper configuration
const io = new Server(server, {
  cors: corsOptions,
  allowEIO3: true,
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Serve static files
app.use(express.static(path.join(__dirname, "public")))

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io
  next()
})



app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API endpoint to get images from upload folder
app.get('/api/images/:category?/:filename?', (req, res) => {
  try {
    const { category, filename } = req.params
    
    // If no parameters, return list of available categories
    if (!category) {
      const uploadsPath = path.join(__dirname, 'uploads')
      
      if (!fs.existsSync(uploadsPath)) {
        return res.status(404).json({
          success: false,
          message: 'Uploads directory not found'
        })
      }
      
      const categories = fs.readdirSync(uploadsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
      
      return res.json({
        success: true,
        data: {
          categories,
          baseUrl: `${req.protocol}://${req.get('host')}/uploads`
        }
      })
    }
    
    // If category but no filename, return list of images in category
    if (category && !filename) {
      const categoryPath = path.join(__dirname, 'uploads', category)
      
      if (!fs.existsSync(categoryPath)) {
        return res.status(404).json({
          success: false,
          message: `Category '${category}' not found`
        })
      }
      
      const images = fs.readdirSync(categoryPath)
        .filter(file => {
          const ext = path.extname(file).toLowerCase()
          return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
        })
        .map(image => ({
          filename: image,
          url: `${req.protocol}://${req.get('host')}/uploads/${category}/${image}`,
          path: `/uploads/${category}/${image}`
        }))
      
      return res.json({
        success: true,
        data: {
          category,
          images,
          count: images.length
        }
      })
    }
    
    // If both category and filename, serve specific image info
    if (category && filename) {
      const imagePath = path.join(__dirname, 'uploads', category, filename)
      
      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        })
      }
      
      const stats = fs.statSync(imagePath)
      const imageInfo = {
        filename,
        category,
        url: `${req.protocol}://${req.get('host')}/uploads/${category}/${filename}`,
        path: `/uploads/${category}/${filename}`,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      }
      
      return res.json({
        success: true,
        data: imageInfo
      })
    }
    
  } catch (error) {
    console.error('Error retrieving images:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving images',
      error: error.message
    })
  }
})

// API endpoint to delete images
app.delete('/api/images/:category/:filename', (req, res) => {
  try {
    const { category, filename } = req.params
    const imagePath = path.join(__dirname, 'uploads', category, filename)
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    fs.unlinkSync(imagePath)
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        category,
        filename,
        deletedPath: `/uploads/${category}/${filename}`
      }
    })
    
  } catch (error) {
    console.error('Error deleting image:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while deleting image',
      error: error.message
    })
  }
})

// API endpoint to get image metadata
app.get('/api/images/:category/:filename/info', (req, res) => {
  try {
    const { category, filename } = req.params
    const imagePath = path.join(__dirname, 'uploads', category, filename)
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    const stats = fs.statSync(imagePath)
    const ext = path.extname(filename).toLowerCase()
    
    const imageInfo = {
      filename,
      category,
      extension: ext,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      url: `${req.protocol}://${req.get('host')}/uploads/${category}/${filename}`,
      path: `/uploads/${category}/${filename}`
    }
    
    res.json({
      success: true,
      data: imageInfo
    })
    
  } catch (error) {
    console.error('Error getting image info:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while getting image info',
      error: error.message
    })
  }
})

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
// Basic test route
app.get("/", (req, res) => {
  res.send(`
    <h1>Car Trading API Server</h1>
    <p>Server is running on port ${process.env.PORT || 5000}</p>
    <p>Socket.IO is active</p>
    <a href="/chat-test.html">Test Chat System</a>
  `)
})

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Car Trading API is running",
    socketIO: "Active",
    port: process.env.PORT || 5000,
  })
})

// Routes

app.use("/api/make", require("./src/modules/car/routes/carMakers"))
app.use("/api/model", require("./src/modules/car/routes/carModels"))
app.use("/api/cities", require("./src/modules/car/routes/cities"))
app.use("/api/compare", require("./src/modules/car/routes/carSettingsRoutes"))
app.use("/api/dealers", require("./src/modules/dealer/routes/dealerRoutes"))


try {
  app.use("/api/users", require("./src/modules/user/routes/userRoutes"))
  app.use("/api/cars", require("./src/modules/car/routes/carRoutes"))
  app.use("/api/sellers", require("./src/modules/seller/routes/sellerRoutes"))
  app.use("/api/dealers", require("./src/modules/dealer/routes/dealerRoutes"))
  app.use("/api/bids", require("./src/modules/bid/routes/bidRoutes"))
  app.use("/api/chat", require("./src/modules/chat/routes/chatRoutes"))
  // app.use("/api/make", require("./src/modules/car/routes/carMakers"))
  app.use("/api/model", require("./src/modules/car/routes/carModels"))
  app.use("/api/state", require("./src/modules/car/routes/states"))

} catch (error) {
  console.log("⚠️  Some routes failed to load:", error.message)
}

// Socket.IO Connection Handling
console.log("🔌 Setting up Socket.IO...")

// Simple authentication for testing
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      console.log("❌ No token provided")
      return next(new Error("No token provided"))
    }

    // Allow test token for development
    if (token === "test-token") {
      socket.userId = "test-user-123"
      socket.userRole = socket.handshake.auth.role || "user"
      socket.userName = "Test User"
      console.log("✅ Test token accepted")
      return next()
    }

    // Try to verify JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
      socket.userId = decoded.id || decoded.userId || "user-" + Date.now()
      socket.userRole = decoded.role || "user"
      socket.userName = decoded.name || "User"
      console.log("✅ JWT token verified")
      return next()
    } catch (jwtError) {
      console.log("⚠️  JWT verification failed, allowing connection anyway for testing")
      socket.userId = "guest-" + Date.now()
      socket.userRole = "guest"
      socket.userName = "Guest User"
      return next()
    }
  } catch (error) {
    console.log("❌ Auth error:", error.message)
    return next(new Error("Authentication failed"))
  }
})

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.userName} (${socket.userRole}) - Socket ID: ${socket.id}`)

  // Send welcome message
  socket.emit("connected", {
    message: "Connected successfully!",
    userId: socket.userId,
    userRole: socket.userRole,
    userName: socket.userName,
    socketId: socket.id,
  })

  // Join user to personal and role rooms
  socket.join(`user_${socket.userId}`)
  socket.join(`role_${socket.userRole}`)

  // Handle joining chat rooms
  socket.on("join_chat", (chatId) => {
    try {
      socket.join(`chat_${chatId}`)
      socket.emit("joined_chat", { chatId })
      socket.to(`chat_${chatId}`).emit("user_joined", {
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
      })
      console.log(`${socket.userName} joined chat: ${chatId}`)
    } catch (error) {
      console.error("Error joining chat:", error)
      socket.emit("error", { message: "Failed to join chat" })
    }
  })

  // Handle leaving chat rooms
  socket.on("leave_chat", (chatId) => {
    try {
      socket.leave(`chat_${chatId}`)
      socket.to(`chat_${chatId}`).emit("user_left", {
        userId: socket.userId,
        userName: socket.userName,
      })
      console.log(`${socket.userName} left chat: ${chatId}`)
    } catch (error) {
      console.error("Error leaving chat:", error)
    }
  })

  // Handle sending messages
  socket.on("send_message", (data) => {
    try {
      const { chatId, message, messageType = "text" } = data

      if (!chatId || !message) {
        socket.emit("error", { message: "Chat ID and message are required" })
        return
      }

      const messageData = {
        chatId,
        message,
        messageType,
        senderId: socket.userId,
        senderName: socket.userName,
        senderRole: socket.userRole,
        timestamp: new Date(),
      }

      // Emit to all users in the chat room (including sender)
      io.to(`chat_${chatId}`).emit("message_received", messageData)

      console.log(`Message sent in chat ${chatId}: ${message.substring(0, 50)}...`)
    } catch (error) {
      console.error("Error sending message:", error)
      socket.emit("error", { message: "Failed to send message" })
    }
  })

  // Handle typing indicators
  socket.on("typing_start", (data) => {
    try {
      const { chatId } = data
      socket.to(`chat_${chatId}`).emit("typing_start", {
        userId: socket.userId,
        userName: socket.userName,
      })
    } catch (error) {
      console.error("Error with typing indicator:", error)
    }
  })

  socket.on("typing_stop", (data) => {
    try {
      const { chatId } = data
      socket.to(`chat_${chatId}`).emit("typing_stop", {
        userId: socket.userId,
        userName: socket.userName,
      })
    } catch (error) {
      console.error("Error with typing indicator:", error)
    }
  })

  // Handle test notifications
  socket.on("test_bid_notification", () => {
    socket.emit("bid_notification", {
      amount: 25000,
      carTitle: "2020 Toyota Camry",
      bidderName: socket.userName,
      timestamp: new Date(),
    })
    console.log("Test bid notification sent to", socket.userName)
  })

  socket.on("test_offer_notification", () => {
    socket.emit("offer_notification", {
      offerAmount: 23000,
      carTitle: "2019 Honda Accord",
      buyerName: socket.userName,
      timestamp: new Date(),
    })
    console.log("Test offer notification sent to", socket.userName)
  })

  socket.on("test_reservation_notification", () => {
    socket.emit("reservation_notification", {
      type: "Test Drive",
      carTitle: "2021 BMW X5",
      customerName: socket.userName,
      date: new Date().toISOString(),
      timestamp: new Date(),
    })
    console.log("Test reservation notification sent to", socket.userName)
  })

  socket.on("test_inspection_notification", () => {
    socket.emit("inspection_notification", {
      status: "Completed",
      carTitle: "2018 Mercedes C-Class",
      mechanicName: socket.userName,
      timestamp: new Date(),
    })
    console.log("Test inspection notification sent to", socket.userName)
  })

  // Handle ping/pong for connection health
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date() })
  })

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.userName} (${socket.userRole}) - Reason: ${reason}`)
  })

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error from", socket.userName, ":", error)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
  console.log(`🔌 Socket.IO server running on port ${PORT}`)
  console.log(`📁 Static files served from: ${path.join(__dirname, "public")}`)
  console.log(`🌐 Open http://localhost:${PORT}/chat-test.html to test chat`)
  console.log(`✅ Server ready for connections`)
})

// Handle server errors
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`❌ Port ${PORT} is already in use`)
    process.exit(1)
  } else {
    console.error("❌ Server error:", error)
  }
})

process.on("unhandledRejection", (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`)
  server.close(() => {
    process.exit(1)
  })
})

process.on("uncaughtException", (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`)
  process.exit(1)
})

// Export for testing
module.exports = { app, server, io }

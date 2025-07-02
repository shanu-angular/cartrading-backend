const socketIo = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('../../user/models/User')
const Chat = require('../models/Chat')

let io

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  })

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication error'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      
      if (!user) {
        return next(new Error('User not found'))
      }

      socket.userId = user._id.toString()
      socket.userRole = user.role
      socket.userName = user.name
      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userName} (${socket.userRole}) - Socket ID: ${socket.id}`)

    // Join user to their personal room
    socket.join(`user_${socket.userId}`)

    // Join user to role-based room
    socket.join(`role_${socket.userRole}`)

    // Handle joining specific chat rooms
    socket.on('join_chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId)
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' })
          return
        }

        // Check if user is participant in this chat
        const isParticipant = chat.participants.some(
          p => p.toString() === socket.userId
        )

        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized to join this chat' })
          return
        }

        socket.join(`chat_${chatId}`)
        socket.emit('joined_chat', { chatId })
        
        // Notify other participants that user joined
        socket.to(`chat_${chatId}`).emit('user_joined_chat', {
          userId: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole
        })

      } catch (error) {
        socket.emit('error', { message: 'Error joining chat' })
      }
    })

    // Handle leaving chat rooms
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`)
      socket.to(`chat_${chatId}`).emit('user_left_chat', {
        userId: socket.userId,
        userName: socket.userName
      })
    })

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { chatId, message, messageType = 'text', attachments = [] } = data

        const chat = await Chat.findById(chatId)
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' })
          return
        }

        // Check if user is participant
        const isParticipant = chat.participants.some(
          p => p.toString() === socket.userId
        )

        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized to send message' })
          return
        }

        // Create message object
        const newMessage = {
          sender: socket.userId,
          message,
          messageType,
          attachments,
          timestamp: new Date(),
          isRead: false
        }

        // Add message to chat
        chat.messages.push(newMessage)
        chat.lastMessage = {
          sender: socket.userId,
          message: messageType === 'text' ? message : `Sent ${messageType}`,
          timestamp: new Date()
        }

        await chat.save()

        // Populate sender info for the response
        await chat.populate('messages.sender', 'name avatar role')
        const populatedMessage = chat.messages[chat.messages.length - 1]

        // Emit to all participants in the chat
        io.to(`chat_${chatId}`).emit('new_message', {
          chatId,
          message: populatedMessage,
          chat: {
            _id: chat._id,
            lastMessage: chat.lastMessage
          }
        })

        // Send push notification to offline users (if implemented)
        const offlineParticipants = chat.participants.filter(
          p => p.toString() !== socket.userId
        )

        // Emit notification to user rooms for real-time updates
        offlineParticipants.forEach(participantId => {
          io.to(`user_${participantId}`).emit('chat_notification', {
            chatId,
            message: populatedMessage,
            senderName: socket.userName,
            senderRole: socket.userRole
          })
        })

      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Error sending message' })
      }
    })

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { chatId } = data
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: true
      })
    })

    socket.on('typing_stop', (data) => {
      const { chatId } = data
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: false
      })
    })

    // Handle message read status
    socket.on('mark_messages_read', async (data) => {
      try {
        const { chatId } = data

        const chat = await Chat.findById(chatId)
        if (!chat) return

        // Mark messages as read for this user
        chat.messages.forEach(msg => {
          if (msg.sender.toString() !== socket.userId && !msg.isRead) {
            msg.isRead = true
          }
        })

        await chat.save()

        // Notify other participants that messages were read
        socket.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          readBy: socket.userId,
          readByName: socket.userName
        })

      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    })

    // Handle role-specific events
    
    // Seller events
    socket.on('seller_car_inquiry', (data) => {
      if (socket.userRole === 'seller') {
        io.to(`role_seller`).emit('new_car_inquiry', {
          ...data,
          sellerId: socket.userId
        })
      }
    })

    // Dealer events
    socket.on('dealer_lot_update', (data) => {
      if (socket.userRole === 'dealer') {
        io.to(`role_dealer`).emit('lot_updated', {
          ...data,
          dealerId: socket.userId
        })
      }
    })

    // Mechanic events
    socket.on('mechanic_inspection_update', (data) => {
      if (socket.userRole === 'mechanic') {
        io.to(`role_mechanic`).emit('inspection_updated', {
          ...data,
          mechanicId: socket.userId
        })
      }
    })

    // Towing events
    socket.on('towing_request_update', (data) => {
      if (socket.userRole === 'towing') {
        io.to(`role_towing`).emit('transport_request_updated', {
          ...data,
          towingServiceId: socket.userId
        })
      }
    })

    // Handle bid/offer notifications
    socket.on('bid_placed', (data) => {
      const { carOwnerId, bidData } = data
      io.to(`user_${carOwnerId}`).emit('new_bid_notification', {
        ...bidData,
        bidderName: socket.userName,
        bidderRole: socket.userRole
      })
    })

    socket.on('offer_made', (data) => {
      const { sellerId, offerData } = data
      io.to(`user_${sellerId}`).emit('new_offer_notification', {
        ...offerData,
        buyerName: socket.userName,
        buyerRole: socket.userRole
      })
    })

    // Handle reservation notifications
    socket.on('reservation_made', (data) => {
      const { carOwnerId, reservationData } = data
      io.to(`user_${carOwnerId}`).emit('new_reservation_notification', {
        ...reservationData,
        customerName: socket.userName,
        customerRole: socket.userRole
      })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userName} (${socket.userRole})`)
      
      // Notify all chat rooms that user left
      socket.rooms.forEach(room => {
        if (room.startsWith('chat_')) {
          socket.to(room).emit('user_left_chat', {
            userId: socket.userId,
            userName: socket.userName
          })
        }
      })
    })

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error)
      socket.emit('error', { message: 'Socket error occurred' })
    })
  })

  return io
}

// Helper function to emit to specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data)
  }
}

// Helper function to emit to specific role
const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role_${role}`).emit(event, data)
  }
}

// Helper function to emit to specific chat
const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(`chat_${chatId}`).emit(event, data)
  }
}

module.exports = {
  initializeSocket,
  emitToUser,
  emitToRole,
  emitToChat
}

const Chat = require("../models/Chat")
const { validationResult } = require("express-validator")

// Get user's chats
const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
    })
      .populate("participants", "name email")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })

    res.json(chats)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get chat messages
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params
    const chat = await Chat.findById(chatId).populate("messages.sender", "name email")

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" })
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    res.json(chat.messages)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Create a new chat
const createChat = async (req, res) => {
  try {
    const { participantId, carId } = req.body

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [req.user.id, participantId] },
      car: carId,
    })

    if (existingChat) {
      return res.json(existingChat)
    }

    // Create new chat
    const chat = new Chat({
      participants: [req.user.id, participantId],
      car: carId,
    })

    await chat.save()
    await chat.populate("participants", "name email")

    res.status(201).json(chat)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  getUserChats,
  getChatMessages,
  createChat,
}

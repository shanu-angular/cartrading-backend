const express = require("express")
const { getUserChats, getChatMessages, createChat } = require("../controllers/chatController")
const {auth} = require("../../../middleware/auth")

const router = express.Router()

// Routes
router.get("/", auth, getUserChats)
router.get("/:chatId/messages", auth, getChatMessages)
router.post("/", auth, createChat)

module.exports = router

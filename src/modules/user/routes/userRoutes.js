const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const { register, login, getProfile, updateProfile } = require("../controllers/userController")
const { auth } = require("../../../middleware/auth")

// Validation middleware
const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("phone").notEmpty().withMessage("Phone number is required"),
]

const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

// Public routes
router.post("/register", registerValidation, register)
router.post("/login", loginValidation, login)

// authed routes
router.get("/profile", auth, getProfile)
router.put("/profile", auth, updateProfile)

module.exports = router

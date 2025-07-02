const express = require("express")
const { body } = require("express-validator")
const {
  createInquiry,
  getReceivedInquiries,
  getSentInquiries,
  respondToInquiry,
} = require("../controllers/inquiryController")
const auth = require("../../../middleware/auth")

const router = express.Router()

// Validation rules
const inquiryValidation = [
  body("message").notEmpty().withMessage("Message is required"),
  body("contactMethod").isIn(["phone", "email", "both"]).withMessage("Invalid contact method"),
]

// Routes
router.post("/car/:carId", auth, inquiryValidation, createInquiry)
router.get("/received", auth, getReceivedInquiries)
router.get("/sent", auth, getSentInquiries)
router.put("/:id/respond", auth, respondToInquiry)

module.exports = router

const express = require("express")
const { body } = require("express-validator")
const { placeBid, getCarBids, getUserBids, respondToBid, withdrawBid } = require("../controllers/bidController")
const {auth} = require("../../../middleware/auth")

const router = express.Router()

// Validation rules
const bidValidation = [
  body("amount").isFloat({ min: 1 }).withMessage("Bid amount must be a positive number"),
  body("message").optional().isLength({ max: 500 }).withMessage("Message cannot exceed 500 characters"),
]

const respondValidation = [
  body("action").isIn(["accept", "reject", "counter"]).withMessage("Invalid action"),
  body("counterAmount").optional().isFloat({ min: 1 }).withMessage("Counter amount must be positive"),
]

// Routes - Fixed the order of middleware and controller functions
router.post("/car/:carId", auth, bidValidation, placeBid)
router.get("/car/:carId", auth, getCarBids)
router.get("/my-bids", auth, getUserBids)
router.put("/:id/respond", auth, respondValidation, respondToBid)
router.put("/:id/withdraw", auth, withdrawBid)

module.exports = router

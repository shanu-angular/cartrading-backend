const express = require("express")
const { body } = require("express-validator")
const {
  makeOffer,
  getCarOffers,
  getUserOffers,
  respondToOffer,
  addNegotiation,
} = require("../controllers/offerController")
const auth = require("../../../middleware/auth")

const router = express.Router()

// Validation rules
const offerValidation = [
  body("amount").isFloat({ min: 1 }).withMessage("Offer amount must be a positive number"),
  body("message").optional().isLength({ max: 500 }).withMessage("Message cannot exceed 500 characters"),
]

// Routes
router.post("/car/:carId", auth, offerValidation, makeOffer)
router.get("/car/:carId", auth, getCarOffers)
router.get("/my-offers", auth, getUserOffers)
router.put("/:id/respond", auth, respondToOffer)
router.post("/:id/negotiate", auth, addNegotiation)

module.exports = router

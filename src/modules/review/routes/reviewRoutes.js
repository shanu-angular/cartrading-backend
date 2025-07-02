const express = require("express")
const { body } = require("express-validator")
const { getCarReviews, createCarReview } = require("../controllers/reviewController")
const auth = require("../../../middleware/auth")

const router = express.Router()

// Validation rules
const reviewValidation = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").trim().isLength({ min: 10 }).withMessage("Comment must be at least 10 characters"),
]

// Routes
router.get("/car/:carId", getCarReviews)
router.post("/car/:carId", auth, reviewValidation, createCarReview)

module.exports = router

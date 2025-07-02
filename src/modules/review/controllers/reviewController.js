const Review = require("../models/Review")
const Car = require("../../car/models/Car")
const { validationResult } = require("express-validator")

// Get car reviews
const getCarReviews = async (req, res) => {
  try {
    const { carId } = req.params
    const reviews = await Review.find({ car: carId }).populate("reviewer", "name").sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Create car review
const createCarReview = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { carId } = req.params
    const { rating, comment } = req.body

    const car = await Car.findById(carId)
    if (!car) {
      return res.status(404).json({ message: "Car not found" })
    }

    // Check if user already reviewed this car
    const existingReview = await Review.findOne({ car: carId, reviewer: req.user.id })
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this car" })
    }

    const review = new Review({
      car: carId,
      reviewer: req.user.id,
      rating,
      comment,
    })

    await review.save()
    res.status(201).json({ message: "Review created successfully", review })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  getCarReviews,
  createCarReview,
}

const Bid = require("../models/Bid")
const Car = require("../../car/models/Car")
const { validationResult } = require("express-validator")

// Place a bid on a car
const placeBid = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { carId } = req.params
    const { amount, message } = req.body

    // Check if car exists
    const car = await Car.findById(carId)
    if (!car) {
      return res.status(404).json({ message: "Car not found" })
    }

    // Create bid
    const bid = new Bid({
      car: carId,
      bidder: req.user.id,
      amount,
      message,
    })

    await bid.save()
    res.status(201).json({ message: "Bid placed successfully", bid })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get all bids for a car
const getCarBids = async (req, res) => {
  try {
    const { carId } = req.params
    const bids = await Bid.find({ car: carId }).populate("bidder", "name email").sort({ createdAt: -1 })
    res.json(bids)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get user's bids
const getUserBids = async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.id })
      .populate("car", "make model year price")
      .sort({ createdAt: -1 })
    res.json(bids)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Respond to a bid
const respondToBid = async (req, res) => {
  try {
    const { id } = req.params
    const { action, counterAmount } = req.body

    const bid = await Bid.findById(id)
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" })
    }

    bid.status = action
    if (action === "counter" && counterAmount) {
      bid.counterOffer = counterAmount
    }

    await bid.save()
    res.json({ message: "Bid response updated", bid })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Withdraw a bid
const withdrawBid = async (req, res) => {
  try {
    const { id } = req.params
    const bid = await Bid.findById(id)

    if (!bid) {
      return res.status(404).json({ message: "Bid not found" })
    }

    if (bid.bidder.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" })
    }

    bid.status = "withdrawn"
    await bid.save()

    res.json({ message: "Bid withdrawn successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  placeBid,
  getCarBids,
  getUserBids,
  respondToBid,
  withdrawBid,
}

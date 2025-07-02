const Inquiry = require("../models/Inquiry")
const Car = require("../../car/models/Car")
const { validationResult } = require("express-validator")

// Create inquiry
const createInquiry = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { carId } = req.params
    const { message } = req.body

    const car = await Car.findById(carId)
    if (!car) {
      return res.status(404).json({ message: "Car not found" })
    }

    const inquiry = new Inquiry({
      car: carId,
      inquirer: req.user.id,
      recipient: car.owner,
      message,
    })

    await inquiry.save()
    res.status(201).json({ message: "Inquiry sent successfully", inquiry })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get received inquiries
const getReceivedInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ recipient: req.user.id })
      .populate("inquirer", "name email")
      .populate("car", "make model year")
      .sort({ createdAt: -1 })

    res.json(inquiries)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get sent inquiries
const getSentInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ inquirer: req.user.id })
      .populate("recipient", "name email")
      .populate("car", "make model year")
      .sort({ createdAt: -1 })

    res.json(inquiries)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Respond to inquiry
const respondToInquiry = async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    const inquiry = await Inquiry.findById(id)
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" })
    }

    if (inquiry.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" })
    }

    inquiry.response = message
    inquiry.status = "responded"
    inquiry.respondedAt = new Date()

    await inquiry.save()
    res.json({ message: "Response sent successfully", inquiry })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  createInquiry,
  getReceivedInquiries,
  getSentInquiries,
  respondToInquiry,
}

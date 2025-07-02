const Towing = require("../models/Towing")
const { validationResult } = require("express-validator")

// Create towing profile
const createTowingProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const existingTowing = await Towing.findOne({ user: req.user.id })
    if (existingTowing) {
      return res.status(400).json({ message: "Towing profile already exists" })
    }

    const towing = new Towing({
      user: req.user.id,
      ...req.body,
    })

    await towing.save()
    res.status(201).json({ message: "Towing profile created successfully", towing })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get towing services
const getTowingServices = async (req, res) => {
  try {
    const services = await Towing.find({ status: "active" }).populate("user", "name email")
    res.json(services)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  createTowingProfile,
  getTowingServices,
}

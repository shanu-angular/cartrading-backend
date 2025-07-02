const Mechanic = require("../models/Mechanic")
const { validationResult } = require("express-validator")

// Create mechanic profile
const createMechanicProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { shopName, shopAddress, shopPhone, licenseNumber, experience } = req.body

    const existingMechanic = await Mechanic.findOne({ user: req.user.id })
    if (existingMechanic) {
      return res.status(400).json({ message: "Mechanic profile already exists" })
    }

    const mechanic = new Mechanic({
      user: req.user.id,
      shopName,
      shopAddress,
      shopPhone,
      licenseNumber,
      experience,
    })

    await mechanic.save()
    res.status(201).json({ message: "Mechanic profile created successfully", mechanic })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get all mechanics
const getMechanics = async (req, res) => {
  try {
    const mechanics = await Mechanic.find({ status: "active" }).populate("user", "name email")
    res.json(mechanics)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  createMechanicProfile,
  getMechanics,
}

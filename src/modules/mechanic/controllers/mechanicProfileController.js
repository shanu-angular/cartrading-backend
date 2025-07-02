const Mechanic = require("../models/Mechanic")
const User = require("../../user/models/User")
const bcrypt = require("bcryptjs")

// Get mechanic profile
const getMechanicProfile = async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user.id }).populate("user", "name email phone")
    if (!mechanic) {
      return res.status(404).json({ message: "Mechanic profile not found" })
    }
    res.json(mechanic)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update mechanic profile
const updateMechanicProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body

    await User.findByIdAndUpdate(req.user.id, {
      name: `${firstName} ${lastName}`,
      email,
      phone,
    })

    const mechanic = await Mechanic.findOneAndUpdate({ user: req.user.id }, req.body, { new: true })

    res.json({ message: "Profile updated successfully", mechanic })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Change mechanic password
const changeMechanicPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user.id)
    const isMatch = await bcrypt.compare(oldPassword, user.password)

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get mechanic sales report
const getMechanicSalesReport = async (req, res) => {
  try {
    const report = {
      totalJobs: 0,
      totalEarnings: 0,
      averageRating: 0,
      completionRate: 0,
    }
    res.json(report)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  getMechanicProfile,
  updateMechanicProfile,
  changeMechanicPassword,
  getMechanicSalesReport,
}

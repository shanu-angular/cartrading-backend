const Towing = require("../models/Towing")
const User = require("../../user/models/User")
const bcrypt = require("bcryptjs")

// Get towing profile
const getTowingProfile = async (req, res) => {
  try {
    const towing = await Towing.findOne({ user: req.user.id }).populate("user", "name email phone")
    if (!towing) {
      return res.status(404).json({ message: "Towing profile not found" })
    }
    res.json(towing)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update towing profile
const updateTowingProfile = async (req, res) => {
  try {
    const towing = await Towing.findOneAndUpdate({ user: req.user.id }, req.body, { new: true })
    if (!towing) {
      return res.status(404).json({ message: "Towing profile not found" })
    }
    res.json({ message: "Profile updated successfully", towing })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Change password
const changePassword = async (req, res) => {
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

// Get profile stats
const getProfileStats = async (req, res) => {
  try {
    const stats = {
      totalJobs: 0,
      completedJobs: 0,
      averageRating: 0,
      totalEarnings: 0,
    }
    res.json(stats)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  getTowingProfile,
  updateTowingProfile,
  changePassword,
  getProfileStats,
}

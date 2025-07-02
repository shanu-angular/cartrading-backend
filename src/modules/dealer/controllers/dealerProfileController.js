const Dealer = require("../models/Dealer")
const User = require("../../user/models/User")
const bcrypt = require("bcryptjs")
const { validationResult } = require("express-validator")

// @desc    Get dealer profile details
// @route   GET /api/dealers/profile/details
// @access  Private (Dealer only)
const getDealerProfile = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id }).populate("user", "name email phone city avatar")

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    res.json({
      success: true,
      data: dealer,
    })
  } catch (error) {
    console.error("Get dealer profile details error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update dealer profile details
// @route   PUT /api/dealers/profile/update
// @access  Private (Dealer only)
const updateDealerProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const { firstName, lastName, email, phone, companyName, address } = req.body

    // Update user information
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken",
        })
      }
    }

    // Update user
    user.name = `${firstName} ${lastName}`
    user.email = email || user.email
    user.phone = phone || user.phone
    await user.save()

    // Update dealer profile
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    dealer.dealershipName = companyName || dealer.dealershipName
    dealer.dealershipAddress = address || dealer.dealershipAddress
    dealer.dealershipPhone = phone || dealer.dealershipPhone

    await dealer.save()

    const updatedDealer = await Dealer.findOne({ user: req.user.id }).populate("user", "name email phone city avatar")

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedDealer,
    })
  } catch (error) {
    console.error("Update dealer profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Change dealer password
// @route   PUT /api/dealers/profile/change-password
// @access  Private (Dealer only)
const changeDealerPassword = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const { oldPassword, newPassword } = req.body

    // Get user with password
    const user = await User.findById(req.user.id).select("+password")
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check old password
    const isMatch = await user.matchPassword(oldPassword)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Change dealer password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

module.exports = {
  getDealerProfile,
  updateDealerProfile,
  changeDealerPassword,
}

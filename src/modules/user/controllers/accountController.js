const User = require("../models/User")
const Bid = require("../../bid/models/Bid")
const Offer = require("../../offer/models/Offer")
const Reservation = require("../../reservation/models/Reservation")
const { validationResult } = require("express-validator")

// @desc    Get account dashboard
// @route   GET /api/users/account/dashboard
// @access  Private
const getAccountDashboard = async (req, res) => {
  try {
    const userId = req.user._id

    // Get user stats
    const [bidsCount, offersCount, reservationsCount] = await Promise.all([
      Bid.countDocuments({ bidder: userId }),
      Offer.countDocuments({ buyer: userId }),
      Reservation.countDocuments({ user: userId }),
    ])

    // Get recent activities
    const recentBids = await Bid.find({ bidder: userId })
      .populate("car", "title images make model year price")
      .sort("-createdAt")
      .limit(5)

    const recentOffers = await Offer.find({ buyer: userId })
      .populate("car", "title images make model year price")
      .sort("-createdAt")
      .limit(5)

    const recentReservations = await Reservation.find({ user: userId })
      .populate("car", "title images make model year price")
      .sort("-createdAt")
      .limit(5)

    res.json({
      success: true,
      data: {
        stats: {
          totalBids: bidsCount,
          totalOffers: offersCount,
          totalReservations: reservationsCount,
        },
        recentActivities: {
          bids: recentBids,
          offers: recentOffers,
          reservations: recentReservations,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update account profile
// @route   PUT /api/users/account/profile
// @access  Private
const updateAccountProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const userId = req.user._id
    const { firstName, lastName, email, phone, city, address } = req.body

    // Check if email is already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken",
        })
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        phone,
        city,
        address,
      },
      { new: true, runValidators: true },
    ).select("-password")

    res.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Change password
// @route   PUT /api/users/account/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const userId = req.user._id
    const { currentPassword, newPassword } = req.body

    // Get user with password
    const user = await User.findById(userId).select("+password")
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword)
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
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

module.exports = {
  getAccountDashboard,
  updateAccountProfile,
  changePassword,
}

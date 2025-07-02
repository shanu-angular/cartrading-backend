const Towing = require("../models/Towing")
const TowingBilling = require("../models/TowingBilling")
const TransportRequest = require("../models/TransportRequest")
const User = require("../../user/models/User")
const bcrypt = require("bcryptjs")

// @desc    Get towing profile (matching your profile UI)
// @route   GET /api/towing/profile
// @access  Private (Towing only)
const getTowingProfile = async (req, res) => {
  try {
    const towingId = req.user._id

    const towing = await Towing.findOne({ user: towingId }).populate("user", "name email phone city")

    if (!towing) {
      return res.status(404).json({
        success: false,
        message: "Towing service profile not found",
      })
    }

    res.json({
      success: true,
      data: towing,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update towing profile
// @route   PUT /api/towing/profile
// @access  Private (Towing only)
const updateTowingProfile = async (req, res) => {
  try {
    const towingId = req.user._id
    const {
      companyName,
      companyAddress,
      companyPhone,
      services,
      serviceArea,
      availability,
      equipment,
      insurance,
      licenseNumber,
    } = req.body

    const towing = await Towing.findOneAndUpdate(
      { user: towingId },
      {
        companyName,
        companyAddress,
        companyPhone,
        services,
        serviceArea,
        availability,
        equipment,
        insurance,
        licenseNumber,
      },
      { new: true, runValidators: true },
    )

    if (!towing) {
      return res.status(404).json({
        success: false,
        message: "Towing service profile not found",
      })
    }

    res.json({
      success: true,
      data: towing,
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

// @desc    Change towing password (matching your change password UI)
// @route   PUT /api/towing/change-password
// @access  Private (Towing only)
const changeTowingPassword = async (req, res) => {
  try {
    const towingId = req.user._id
    const { currentPassword, newPassword } = req.body

    // Get user with password
    const user = await User.findById(towingId).select("+password")
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

// @desc    Get vehicle transport list (matching your transport list UI)
// @route   GET /api/towing/vehicle-transport-list
// @access  Private (Towing only)
const getVehicleTransportList = async (req, res) => {
  try {
    const towingId = req.user._id
    const { status, page = 1, limit = 10 } = req.query

    const towing = await Towing.findOne({ user: towingId })
    if (!towing) {
      return res.status(404).json({
        success: false,
        message: "Towing service profile not found",
      })
    }

    const query = {
      assignedTowing: towing._id,
      ...(status && { status }),
    }

    const transportRequests = await TransportRequest.find(query)
      .populate("vehicle", "make model year color")
      .populate("requestedBy", "name phone email")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await TransportRequest.countDocuments(query)

    // Add distance and estimated time for each request
    const requestsWithDetails = transportRequests.map((request) => {
      // Calculate estimated distance and time (simplified)
      const estimatedDistance = Math.floor(Math.random() * 50) + 5 // 5-55 km
      const estimatedTime = Math.floor((estimatedDistance / 40) * 60) + 15 // minutes

      return {
        ...request.toObject(),
        estimatedDistance: `${estimatedDistance} km`,
        estimatedTime: `${estimatedTime} min`,
        priority: request.urgency === "emergency" ? "High" : "Normal",
      }
    })

    res.json({
      success: true,
      data: requestsWithDetails,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
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

// @desc    Get towing billing (matching your billing UI)
// @route   GET /api/towing/billing
// @access  Private (Towing only)
const getTowingBilling = async (req, res) => {
  try {
    const towingId = req.user._id
    const { status, page = 1, limit = 10, startDate, endDate } = req.query

    const towing = await Towing.findOne({ user: towingId })
    if (!towing) {
      return res.status(404).json({
        success: false,
        message: "Towing service profile not found",
      })
    }

    const query = { towing: towing._id }
    if (status) query.status = status

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const billingRecords = await TowingBilling.find(query)
      .populate("transportRequest", "pickupLocation dropoffLocation")
      .populate("customer", "name phone")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await TowingBilling.countDocuments(query)

    // Calculate summary stats
    const totalRevenue = await TowingBilling.aggregate([
      { $match: { towing: towing._id, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    const pendingAmount = await TowingBilling.aggregate([
      { $match: { towing: towing._id, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    res.json({
      success: true,
      data: billingRecords,
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0,
        totalRecords: total,
      },
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
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

module.exports = {
  getTowingProfile,
  updateTowingProfile,
  changeTowingPassword,
  getVehicleTransportList,
  getTowingBilling,
}

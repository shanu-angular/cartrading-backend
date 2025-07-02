const Seller = require("../models/Seller")
const User = require("../../user/models/User")
const Car = require("../../car/models/Car")
const { validationResult } = require("express-validator")

// @desc    Create seller profile
// @route   POST /api/sellers/profile
// @access  Private
const createSellerProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    // Check if seller profile already exists
    const existingSeller = await Seller.findOne({ user: req.user._id })
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: "Seller profile already exists",
      })
    }

    const sellerData = {
      ...req.body,
      user: req.user._id,
    }

    const seller = await Seller.create(sellerData)

    // Update user role to seller
    await User.findByIdAndUpdate(req.user._id, { role: "seller" })

    res.status(201).json({
      success: true,
      data: seller,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get seller profile
// @route   GET /api/sellers/profile
// @access  Private
const getSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id }).populate("user", "name email phone")

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    res.json({
      success: true,
      data: seller,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get seller cars
// @route   GET /api/sellers/cars
// @access  Private
const getSellerCars = async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user._id }).sort("-createdAt")

    res.json({
      success: true,
      data: cars,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update seller profile
// @route   PUT /api/sellers/profile
// @access  Private
const updateSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findOneAndUpdate({ user: req.user._id }, req.body, { new: true, runValidators: true })

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    res.json({
      success: true,
      data: seller,
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
  createSellerProfile,
  getSellerProfile,
  getSellerCars,
  updateSellerProfile,
}

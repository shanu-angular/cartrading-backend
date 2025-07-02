const SellerProfile = require("../models/SellerProfile")
const Seller = require("../models/Seller")
const User = require("../../user/models/User")
const bcrypt = require("bcryptjs")
const { validationResult } = require("express-validator")

// @desc    Get seller profile info
// @route   GET /api/sellers/profile/info
// @access  Private (Seller only)
const getSellerProfileInfo = async (req, res) => {
  try {
    const sellerId = req.user._id

    const seller = await Seller.findOne({ user: sellerId }).populate("user", "name email phone city")

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    // Get or create seller profile
    let sellerProfile = await SellerProfile.findOne({ seller: seller._id })

    if (!sellerProfile) {
      // Create default profile from user data
      const user = seller.user
      const nameParts = user.name.split(" ")

      sellerProfile = await SellerProfile.create({
        seller: seller._id,
        personalInfo: {
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: user.email,
          phone: user.phone,
          address: {
            city: user.city,
          },
        },
        businessInfo: {
          businessName: seller.businessName,
          businessPhone: seller.businessPhone,
          businessAddress: {
            street: seller.businessAddress,
          },
          licenseNumber: seller.licenseNumber,
        },
      })
    }

    res.json({
      success: true,
      data: {
        seller,
        profile: sellerProfile,
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

// @desc    Update seller profile info
// @route   PUT /api/sellers/profile/info
// @access  Private (Seller only)
const updateSellerProfileInfo = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const sellerId = req.user._id
    const { firstName, lastName, email, phone, address } = req.body

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    // Update user information
    const user = await User.findById(sellerId)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: sellerId } })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken",
        })
      }
    }

    user.name = `${firstName} ${lastName}`
    user.email = email || user.email
    user.phone = phone || user.phone
    await user.save()

    // Update seller profile
    let sellerProfile = await SellerProfile.findOne({ seller: seller._id })

    if (!sellerProfile) {
      sellerProfile = new SellerProfile({ seller: seller._id })
    }

    sellerProfile.personalInfo = {
      firstName,
      lastName,
      email: email || user.email,
      phone: phone || user.phone,
      address: address || sellerProfile.personalInfo.address,
    }

    await sellerProfile.save()

    res.json({
      success: true,
      data: sellerProfile,
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

// @desc    Change seller password
// @route   PUT /api/sellers/profile/change-password
// @access  Private (Seller only)
const changeSellerPassword = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const sellerId = req.user._id
    const { oldPassword, newPassword } = req.body

    // Get user with password
    const user = await User.findById(sellerId).select("+password")
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
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get seller name & address
// @route   GET /api/sellers/profile/name-address
// @access  Private (Seller only)
const getSellerNameAddress = async (req, res) => {
  try {
    const sellerId = req.user._id

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    const sellerProfile = await SellerProfile.findOne({ seller: seller._id })

    const nameAddress = {
      name: seller.businessName || sellerProfile?.personalInfo?.firstName + " " + sellerProfile?.personalInfo?.lastName,
      address: seller.businessAddress || sellerProfile?.personalInfo?.address,
      coordinates: sellerProfile?.locationInfo?.coordinates,
      mapDisplayName: sellerProfile?.locationInfo?.mapDisplayName,
    }

    res.json({
      success: true,
      data: nameAddress,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update seller name & address
// @route   PUT /api/sellers/profile/name-address
// @access  Private (Seller only)
const updateSellerNameAddress = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { name, address, coordinates, mapDisplayName } = req.body

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    // Update seller business info
    seller.businessName = name
    seller.businessAddress = address
    await seller.save()

    // Update seller profile location info
    let sellerProfile = await SellerProfile.findOne({ seller: seller._id })
    if (!sellerProfile) {
      sellerProfile = new SellerProfile({ seller: seller._id })
    }

    sellerProfile.locationInfo = {
      coordinates,
      mapDisplayName,
      isLocationPublic: true,
    }

    await sellerProfile.save()

    res.json({
      success: true,
      data: {
        name,
        address,
        coordinates,
        mapDisplayName,
      },
      message: "Name and address updated successfully",
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
  getSellerProfileInfo,
  updateSellerProfileInfo,
  changeSellerPassword,
  getSellerNameAddress,
  updateSellerNameAddress,
}

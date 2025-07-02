const Seller = require("../modules/seller/models/Seller")

const sellerAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    // Check if user has seller role
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Seller access required",
      })
    }

    // Check if seller profile exists
    const seller = await Seller.findOne({ user: req.user._id })
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    // Check if seller is active
    if (!seller.isActive) {
      return res.status(403).json({
        success: false,
        message: "Seller account is inactive",
      })
    }

    // Add seller info to request
    req.seller = seller

    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error in seller authentication",
      error: error.message,
    })
  }
}

module.exports = sellerAuth

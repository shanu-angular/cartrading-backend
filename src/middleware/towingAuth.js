const Towing = require("../modules/towing/models/Towing")

const towingAuth = async (req, res, next) => {
  try {
    // Check if user has towing service profile
    const towingService = await Towing.findOne({ user: req.user._id })

    if (!towingService) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Towing service profile required.",
      })
    }

    // Check if towing service is active
    if (!towingService.isActive) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Towing service account is inactive.",
      })
    }

    // Add towing service to request object
    req.towingService = towingService
    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

module.exports = towingAuth

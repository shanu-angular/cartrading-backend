const Mechanic = require("../modules/mechanic/models/Mechanic")

const mechanicAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    // Check if user has mechanic role
    if (req.user.role !== "mechanic") {
      return res.status(403).json({
        success: false,
        message: "Mechanic access required",
      })
    }

    // Check if mechanic profile exists
    const mechanic = await Mechanic.findOne({ user: req.user._id })
    if (!mechanic) {
      return res.status(403).json({
        success: false,
        message: "Mechanic profile not found",
      })
    }

    // Check if mechanic is active
    if (!mechanic.isActive) {
      return res.status(403).json({
        success: false,
        message: "Mechanic account is inactive",
      })
    }

    // Add mechanic info to request
    req.mechanic = mechanic

    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error in mechanic authentication",
      error: error.message,
    })
  }
}

module.exports = mechanicAuth

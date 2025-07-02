const Dealer = require("../modules/dealer/models/Dealer")

const dealerAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    // Check if user has dealer role
    if (req.user.role !== "dealer") {
      return res.status(403).json({
        success: false,
        message: "Dealer access required",
      })
    }
    console.log(req.user._id,"dealer.")

    // Check if dealer profile exists
   const dealer = await Dealer.findOne({ user: req.user._id }) // ✅ Correct

    
    // console.log(dealer,"dealer.")

    if (!dealer) {
      return res.status(403).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    // Check if dealer is active
    if (!dealer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Dealer account is inactive",
      })
    }

    // Add dealer info to request
    req.dealer = dealer

    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error in dealer authentication",
      error: error.message,
    })
  }
}

module.exports = dealerAuth

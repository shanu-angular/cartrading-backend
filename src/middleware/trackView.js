const CarView = require("../modules/car/models/CarView")

const trackView = (viewType = "list") => {
  return async (req, res, next) => {
    try {
      const carId = req.params.id
      const ipAddress = req.ip || req.connection.remoteAddress
      const userAgent = req.get("User-Agent")

      // Check if this IP has viewed this car in the last 24 hours
      const existingView = await CarView.findOne({
        car: carId,
        ipAddress,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })

      if (!existingView) {
        await CarView.create({
          car: carId,
          viewer: req.user?._id,
          ipAddress,
          userAgent,
          viewType,
        })
      }

      next()
    } catch (error) {
      // Don't fail the request if view tracking fails
      console.error("View tracking error:", error)
      next()
    }
  }
}

module.exports = trackView

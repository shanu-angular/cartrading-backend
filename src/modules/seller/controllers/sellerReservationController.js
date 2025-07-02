const Reservation = require("../../reservation/models/Reservation")
const Seller = require("../models/Seller")
const Car = require("../../car/models/Car")

// @desc    Get seller's reserve requests
// @route   GET /api/sellers/reservations/requests
// @access  Private (Seller only)
const getReserveRequests = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { status, page = 1, limit = 10 } = req.query

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    // Get cars owned by seller
    const sellerCars = await Car.find({ owner: sellerId, ownerType: "seller" }).select("_id")
    const carIds = sellerCars.map((car) => car._id)

    // Build query for reservations
    const query = { car: { $in: carIds } }
    if (status) query.status = status

    const reservations = await Reservation.find(query)
      .populate("car", "title images make model year price")
      .populate("user", "name phone email")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Reservation.countDocuments(query)

    res.json({
      success: true,
      data: reservations,
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

// @desc    Accept reservation request
// @route   PUT /api/sellers/reservations/:id/accept
// @access  Private (Seller only)
const acceptReservation = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { message } = req.body

    const reservation = await Reservation.findById(req.params.id).populate("car")

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      })
    }

    // Check if seller owns the car
    if (reservation.car.owner.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this reservation",
      })
    }

    reservation.status = "confirmed"
    reservation.response = {
      message: message || "Reservation accepted",
      respondedAt: new Date(),
      respondedBy: sellerId,
    }

    await reservation.save()

    res.json({
      success: true,
      data: reservation,
      message: "Reservation accepted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Reject reservation request
// @route   PUT /api/sellers/reservations/:id/reject
// @access  Private (Seller only)
const rejectReservation = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { message } = req.body

    const reservation = await Reservation.findById(req.params.id).populate("car")

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      })
    }

    // Check if seller owns the car
    if (reservation.car.owner.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject this reservation",
      })
    }

    reservation.status = "cancelled"
    reservation.response = {
      message: message || "Reservation rejected",
      respondedAt: new Date(),
      respondedBy: sellerId,
    }

    await reservation.save()

    res.json({
      success: true,
      data: reservation,
      message: "Reservation rejected",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get user's reserved cars (for buyers)
// @route   GET /api/sellers/reservations/my-reserved-cars
// @access  Private
const getMyReservedCars = async (req, res) => {
  try {
    const userId = req.user._id
    const { status, page = 1, limit = 10 } = req.query

    const query = { user: userId }
    if (status) query.status = status

    const reservations = await Reservation.find(query)
      .populate("car", "title images make model year price")
      .populate("carOwner", "name phone")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Reservation.countDocuments(query)

    // Add additional status information
    const enrichedReservations = reservations.map((reservation) => {
      let statusInfo = {}

      switch (reservation.status) {
        case "cancelled":
          statusInfo = {
            message: "Reservation was Cancelled Automatically",
            canBuy: false,
            canCancel: false,
          }
          break
        case "completed":
          statusInfo = {
            message: "Car was sold",
            canBuy: false,
            canCancel: false,
          }
          break
        case "confirmed":
          statusInfo = {
            message: "Reservation confirmed",
            canBuy: true,
            canCancel: true,
          }
          break
        case "pending":
          statusInfo = {
            message: "Reservation pending approval",
            canBuy: false,
            canCancel: true,
          }
          break
        default:
          statusInfo = {
            message: "Reservation active",
            canBuy: true,
            canCancel: true,
          }
      }

      return {
        ...reservation.toObject(),
        statusInfo,
      }
    })

    res.json({
      success: true,
      data: enrichedReservations,
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

// @desc    Cancel user's reservation
// @route   PUT /api/sellers/reservations/my-reserved/:id/cancel
// @access  Private
const cancelMyReservation = async (req, res) => {
  try {
    const userId = req.user._id

    const reservation = await Reservation.findById(req.params.id)

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      })
    }

    // Check if user owns the reservation
    if (reservation.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this reservation",
      })
    }

    if (reservation.status === "completed" || reservation.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed or already cancelled reservation",
      })
    }

    reservation.status = "cancelled"
    await reservation.save()

    res.json({
      success: true,
      data: reservation,
      message: "Reservation cancelled successfully",
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
  getReserveRequests,
  acceptReservation,
  rejectReservation,
  getMyReservedCars,
  cancelMyReservation,
}

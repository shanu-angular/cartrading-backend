const Seller = require("../models/Seller")
const SellerListing = require("../models/SellerListing")
const Car = require("../../car/models/Car")
const Bid = require("../../bid/models/Bid")
const Offer = require("../../offer/models/Offer")
const Reservation = require("../../reservation/models/Reservation")
const Inquiry = require("../../inquiry/models/Inquiry") // Declare the Inquiry variable

// @desc    Get "My Listed Cars" page data
// @route   GET /api/sellers/management/my-listed-cars
// @access  Private (Seller only)
const getMyListedCars = async (req, res) => {
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

    // Build query
    const query = { owner: sellerId, ownerType: "seller" }
    if (status) {
      if (status === "active") query.isActive = true
      if (status === "inactive") query.isActive = false
    }

    const cars = await Car.find(query)
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    // Get listing information for each car
    const carsWithListingInfo = await Promise.all(
      cars.map(async (car) => {
        const listing = await SellerListing.findOne({ car: car._id })

        // Get stats for each car
        const [bidCount, offerCount, reservationCount, viewCount] = await Promise.all([
          Bid.countDocuments({ car: car._id }),
          Offer.countDocuments({ car: car._id }),
          Reservation.countDocuments({ car: car._id }),
          car.views || 0,
        ])

        return {
          ...car.toObject(),
          listingInfo: listing
            ? {
                plan: listing.listingPlan,
                status: listing.listingStatus,
                expiryDate: listing.expiryDate,
                pricing: listing.pricing,
              }
            : null,
          stats: {
            views: viewCount,
            bids: bidCount,
            offers: offerCount,
            reservations: reservationCount,
          },
        }
      }),
    )

    const total = await Car.countDocuments(query)

    res.json({
      success: true,
      data: carsWithListingInfo,
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

// @desc    Get "My Cars Bid Offers" page data
// @route   GET /api/sellers/management/bid-offers
// @access  Private (Seller only)
const getMyCarsBidOffers = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { status, page = 1, limit = 10 } = req.query

    const query = { carOwner: sellerId }
    if (status) query.status = status

    const bids = await Bid.find(query)
      .populate("car", "title images make model year price")
      .populate("bidder", "name phone email")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Bid.countDocuments(query)

    // Add time remaining for each bid
    const bidsWithTimeInfo = bids.map((bid) => {
      const timeRemaining = bid.expiresAt ? Math.max(0, bid.expiresAt - new Date()) : 0
      const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
      const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      return {
        ...bid.toObject(),
        timeRemaining: {
          days: daysRemaining,
          hours: hoursRemaining,
          expired: timeRemaining <= 0,
        },
      }
    })

    res.json({
      success: true,
      data: bidsWithTimeInfo,
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

// @desc    Get "My Cars Buy Requests" page data
// @route   GET /api/sellers/management/buy-requests
// @access  Private (Seller only)
const getMyCarsBuyRequests = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { status, page = 1, limit = 10 } = req.query

    const query = { seller: sellerId }
    if (status) query.status = status

    const offers = await Offer.find(query)
      .populate("car", "title images make model year price")
      .populate("buyer", "name phone email")
      .populate("exchangeDetails.exchangeCar", "title price images")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Offer.countDocuments(query)

    res.json({
      success: true,
      data: offers,
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

// @desc    Get "My Cars General Requests" page data
// @route   GET /api/sellers/management/general-requests
// @access  Private (Seller only)
const getMyGeneralRequests = async (req, res) => {
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

    // Get inquiries for seller's cars
    const sellerCars = await Car.find({ owner: sellerId, ownerType: "seller" }).select("_id")
    const carIds = sellerCars.map((car) => car._id)

    const query = { car: { $in: carIds } }
    if (status) query.status = status

    const inquiries = await Inquiry.find(query)
      .populate("car", "title images make model year")
      .populate("inquirer", "name phone email")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Inquiry.countDocuments(query)

    res.json({
      success: true,
      data: inquiries,
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
  getMyListedCars,
  getMyCarsBidOffers,
  getMyCarsBuyRequests,
  getMyGeneralRequests,
}

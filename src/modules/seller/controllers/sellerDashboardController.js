const Seller = require("../models/Seller")
const SellerListing = require("../models/SellerListing")
const Car = require("../../car/models/Car")
const Bid = require("../../bid/models/Bid")
const Offer = require("../../offer/models/Offer")
const Reservation = require("../../reservation/models/Reservation")

// @desc    Get seller dashboard data
// @route   GET /api/sellers/dashboard
// @access  Private (Seller only)
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    // Get seller's cars
    const sellerCars = await Car.find({ owner: sellerId, ownerType: "seller" }).select("_id")
    const carIds = sellerCars.map((car) => car._id)

    // Get dashboard stats
    const [
      totalListings,
      activeListings,
      totalViews,
      totalBids,
      totalOffers,
      totalReservations,
      pendingBids,
      pendingOffers,
    ] = await Promise.all([
      SellerListing.countDocuments({ seller: seller._id }),
      SellerListing.countDocuments({ seller: seller._id, listingStatus: "active" }),
      SellerListing.aggregate([
        { $match: { seller: seller._id } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
      ]),
      Bid.countDocuments({ car: { $in: carIds } }),
      Offer.countDocuments({ car: { $in: carIds } }),
      Reservation.countDocuments({ car: { $in: carIds } }),
      Bid.countDocuments({ car: { $in: carIds }, status: "pending" }),
      Offer.countDocuments({ car: { $in: carIds }, status: "pending" }),
    ])

    // Get recent activities
    const recentBids = await Bid.find({ car: { $in: carIds } })
      .populate("car", "title images make model year")
      .populate("bidder", "name phone")
      .sort("-createdAt")
      .limit(5)

    const recentOffers = await Offer.find({ car: { $in: carIds } })
      .populate("car", "title images make model year")
      .populate("buyer", "name phone")
      .sort("-createdAt")
      .limit(5)

    const recentListings = await SellerListing.find({ seller: seller._id })
      .populate("car", "title images make model year price")
      .sort("-createdAt")
      .limit(5)

    // Calculate revenue (from completed listings)
    const revenueData = await SellerListing.aggregate([
      { $match: { seller: seller._id, paymentStatus: "completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$pricing.totalCost" },
          totalTransactions: { $sum: 1 },
        },
      },
    ])

    const revenue = revenueData.length > 0 ? revenueData[0] : { totalRevenue: 0, totalTransactions: 0 }

    res.json({
      success: true,
      data: {
        stats: {
          totalListings,
          activeListings,
          totalViews: totalViews.length > 0 ? totalViews[0].totalViews : 0,
          totalBids,
          totalOffers,
          totalReservations,
          pendingBids,
          pendingOffers,
          revenue: revenue.totalRevenue,
          totalTransactions: revenue.totalTransactions,
        },
        recentActivities: {
          bids: recentBids,
          offers: recentOffers,
          listings: recentListings,
        },
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

// @desc    Get seller reports
// @route   GET /api/sellers/reports
// @access  Private (Seller only)
const getSellerReports = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { period = "month" } = req.query

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate
    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get listings performance
    const listingsReport = await SellerListing.aggregate([
      {
        $match: {
          seller: seller._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          views: { $sum: "$views" },
          inquiries: { $sum: "$inquiries" },
          revenue: { $sum: "$pricing.totalCost" },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Get top performing cars
    const topCars = await SellerListing.find({ seller: seller._id })
      .populate("car", "title make model year price")
      .sort("-views")
      .limit(10)

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate,
          end: now,
        },
        listingsPerformance: listingsReport,
        topPerformingCars: topCars,
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
  getSellerDashboard,
  getSellerReports,
}

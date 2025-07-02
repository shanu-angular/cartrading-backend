const Dealer = require("../models/Dealer")
const DealerLot = require("../models/DealerLot")
const DealerBilling = require("../models/DealerBilling")
const Car = require("../../car/models/Car")
const Inquiry = require("../../inquiry/models/Inquiry")
const Bid = require("../../bid/models/Bid")
const Offer = require("../../offer/models/Offer")

// @desc    Get dealer dashboard data
// @route   GET /api/dealers/dashboard
// @access  Private (Dealer only)
const getDealerDashboard = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id }).populate("user", "name email")

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    // Get basic statistics
    const [totalCars, activeCars, totalLots, pendingBills, totalInquiries, pendingBids, pendingOffers] =
      await Promise.all([
        Car.countDocuments({ owner: req.user.id, ownerType: "dealer" }),
        Car.countDocuments({ owner: req.user.id, ownerType: "dealer", status: "active" }),
        DealerLot.countDocuments({ dealer: dealer._id, isActive: true }),
        DealerBilling.countDocuments({ dealer: dealer._id, status: "pending" }),
        Inquiry.countDocuments({ carOwner: req.user.id, status: "pending" }),
        Bid.countDocuments({ carOwner: req.user.id, status: "pending" }),
        Offer.countDocuments({ seller: req.user.id, status: "pending" }),
      ])

    // Get recent activities
    const recentCars = await Car.find({ owner: req.user.id, ownerType: "dealer" })
      .sort("-createdAt")
      .limit(5)
      .select("title price images createdAt status")

    const recentInquiries = await Inquiry.find({ carOwner: req.user.id })
      .populate("car", "title")
      .populate("inquirer", "name")
      .sort("-createdAt")
      .limit(5)

    // Calculate monthly revenue
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyRevenue = await DealerBilling.aggregate([
      {
        $match: {
          dealer: dealer._id,
          status: "paid",
          "paymentDetails.paymentDate": { $gte: currentMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ])

    const dashboardData = {
      dealer: {
        id: dealer._id,
        name: dealer.dealershipName,
        status: dealer.status,
        user: dealer.user,
      },
      statistics: {
        totalCars,
        activeCars,
        soldCars: totalCars - activeCars,
        totalLots,
        pendingBills,
        totalInquiries,
        pendingBids,
        pendingOffers,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
      },
      recentActivities: {
        cars: recentCars,
        inquiries: recentInquiries,
      },
    }

    res.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error("Get dealer dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get dealer statistics
// @route   GET /api/dealers/stats
// @access  Private (Dealer only)
const getDealerStats = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    // Get car statistics
    const carStats = await Car.aggregate([
      { $match: { owner: req.user.id, ownerType: "dealer" } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$price" },
        },
      },
    ])

    // Get inquiry statistics
    const inquiryStats = await Inquiry.aggregate([
      { $match: { carOwner: req.user.id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Get monthly performance
    const monthlyPerformance = await Car.aggregate([
      {
        $match: {
          owner: req.user.id,
          ownerType: "dealer",
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          listings: { $sum: 1 },
          totalValue: { $sum: "$price" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ])

    res.json({
      success: true,
      data: {
        carStats,
        inquiryStats,
        monthlyPerformance,
      },
    })
  } catch (error) {
    console.error("Get dealer stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get dealer performance reports
// @route   GET /api/dealers/performance
// @access  Private (Dealer only)
const getDealerPerformance = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    const { year = new Date().getFullYear() } = req.query

    // Sales performance
    const salesData = await Car.aggregate([
      {
        $match: {
          owner: req.user.id,
          ownerType: "dealer",
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${Number.parseInt(year) + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalListings: { $sum: 1 },
          totalValue: { $sum: "$price" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ])

    // Revenue data
    const revenueData = await DealerBilling.aggregate([
      {
        $match: {
          dealer: dealer._id,
          status: "paid",
          "paymentDetails.paymentDate": {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${Number.parseInt(year) + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$paymentDetails.paymentDate" },
            year: { $year: "$paymentDetails.paymentDate" },
          },
          totalRevenue: { $sum: "$totalAmount" },
          totalTransactions: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ])

    res.json({
      success: true,
      data: {
        year,
        salesPerformance: salesData,
        revenueData,
      },
    })
  } catch (error) {
    console.error("Get dealer performance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

module.exports = {
  getDealerDashboard,
  getDealerStats,
  getDealerPerformance,
}

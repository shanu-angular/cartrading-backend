const SellerRequest = require("../models/SellerRequest")
const Seller = require("../models/Seller")
const Car = require("../../car/models/Car")
const Bid = require("../../bid/models/Bid")
const Offer = require("../../offer/models/Offer")
const { validationResult } = require("express-validator")

// @desc    Get seller's bid offers
// @route   GET /api/sellers/requests/bid-offers
// @access  Private (Seller only)
const getBidOffers = async (req, res) => {
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

    // Get bids for seller's cars
    const query = { carOwner: sellerId }
    if (status) query.status = status

    const bids = await Bid.find(query)
      .populate("car", "title images make model year price")
      .populate("bidder", "name phone email")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Bid.countDocuments(query)

    res.json({
      success: true,
      data: bids,
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

// @desc    Get seller's buy requests
// @route   GET /api/sellers/requests/buy-requests
// @access  Private (Seller only)
const getBuyRequests = async (req, res) => {
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

    // Get offers for seller's cars
    const query = { seller: sellerId }
    if (status) query.status = status

    const offers = await Offer.find(query)
      .populate("car", "title images make model year price")
      .populate("buyer", "name phone email")
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

// @desc    Get seller's general requests
// @route   GET /api/sellers/requests/general-requests
// @access  Private (Seller only)
const getGeneralRequests = async (req, res) => {
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

    const query = { seller: seller._id, requestType: "general" }
    if (status) query.status = status

    const requests = await SellerRequest.find(query)
      .populate("car", "title images make model year")
      .populate("requester", "name phone email")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await SellerRequest.countDocuments(query)

    res.json({
      success: true,
      data: requests,
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

// @desc    Get seller's reserve requests
// @route   GET /api/sellers/requests/reserve-requests
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

    const query = { seller: seller._id, requestType: "reserve_request" }
    if (status) query.status = status

    const requests = await SellerRequest.find(query)
      .populate("car", "title images make model year")
      .populate("requester", "name phone email")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await SellerRequest.countDocuments(query)

    res.json({
      success: true,
      data: requests,
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

// @desc    Accept bid offer
// @route   PUT /api/sellers/requests/bids/:id/accept
// @access  Private (Seller only)
const acceptBidOffer = async (req, res) => {
  try {
    const sellerId = req.user._id

    const bid = await Bid.findById(req.params.id).populate("car")

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      })
    }

    // Check if seller owns the car
    if (bid.carOwner.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this bid",
      })
    }

    bid.status = "accepted"
    bid.response = {
      message: "Bid accepted",
      respondedAt: new Date(),
    }

    await bid.save()

    res.json({
      success: true,
      data: bid,
      message: "Bid offer accepted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Reject bid offer
// @route   PUT /api/sellers/requests/bids/:id/reject
// @access  Private (Seller only)
const rejectBidOffer = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { message } = req.body

    const bid = await Bid.findById(req.params.id)

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      })
    }

    // Check if seller owns the car
    if (bid.carOwner.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject this bid",
      })
    }

    bid.status = "rejected"
    bid.response = {
      message: message || "Bid rejected",
      respondedAt: new Date(),
    }

    await bid.save()

    res.json({
      success: true,
      data: bid,
      message: "Bid offer rejected",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Accept buy request
// @route   PUT /api/sellers/requests/buy-requests/:id/accept
// @access  Private (Seller only)
const acceptBuyRequest = async (req, res) => {
  try {
    const sellerId = req.user._id

    const offer = await Offer.findById(req.params.id)

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Buy request not found",
      })
    }

    // Check if seller owns the car
    if (offer.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this request",
      })
    }

    offer.status = "accepted"
    offer.response = {
      message: "Buy request accepted",
      respondedAt: new Date(),
    }

    await offer.save()

    res.json({
      success: true,
      data: offer,
      message: "Buy request accepted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Cancel buy request
// @route   PUT /api/sellers/requests/buy-requests/:id/cancel
// @access  Private (Seller only)
const cancelBuyRequest = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { message } = req.body

    const offer = await Offer.findById(req.params.id)

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Buy request not found",
      })
    }

    // Check if seller owns the car
    if (offer.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request",
      })
    }

    offer.status = "cancelled"
    offer.response = {
      message: message || "Buy request cancelled",
      respondedAt: new Date(),
    }

    await offer.save()

    res.json({
      success: true,
      data: offer,
      message: "Buy request cancelled",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Accept general request
// @route   PUT /api/sellers/requests/general/:id/accept
// @access  Private (Seller only)
const acceptGeneralRequest = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { message } = req.body

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    const request = await SellerRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      })
    }

    // Check if seller owns the request
    if (request.seller.toString() !== seller._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this request",
      })
    }

    request.status = "accepted"
    request.response = {
      message: message || "Request accepted",
      respondedAt: new Date(),
    }
    request.isRead = true

    await request.save()

    res.json({
      success: true,
      data: request,
      message: "Request accepted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Cancel general request
// @route   PUT /api/sellers/requests/general/:id/cancel
// @access  Private (Seller only)
const cancelGeneralRequest = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { message } = req.body

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    const request = await SellerRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      })
    }

    // Check if seller owns the request
    if (request.seller.toString() !== seller._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request",
      })
    }

    request.status = "cancelled"
    request.response = {
      message: message || "Request cancelled",
      respondedAt: new Date(),
    }
    request.isRead = true

    await request.save()

    res.json({
      success: true,
      data: request,
      message: "Request cancelled",
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
  getBidOffers,
  getBuyRequests,
  getGeneralRequests,
  getReserveRequests,
  acceptBidOffer,
  rejectBidOffer,
  acceptBuyRequest,
  cancelBuyRequest,
  acceptGeneralRequest,
  cancelGeneralRequest,
}

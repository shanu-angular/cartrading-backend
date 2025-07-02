const Offer = require("../models/Offer")
const Car = require("../../car/models/Car")
const { validationResult } = require("express-validator")

// @desc    Make offer on a car
// @route   POST /api/offers/car/:carId
// @access  Private
const makeOffer = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { carId } = req.params
    const { offerAmount, offerType, paymentMethod } = req.body

    const car = await Car.findById(carId)
    if (!car) {
      return res.status(404).json({ message: "Car not found" })
    }

    const offer = new Offer({
      car: carId,
      buyer: req.user.id,
      seller: car.owner,
      offerAmount,
      offerType,
      paymentMethod,
    })

    await offer.save()
    res.status(201).json({ message: "Offer made successfully", offer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get offers for a car (for seller)
// @route   GET /api/offers/car/:carId
// @access  Private
const getCarOffers = async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId)
    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    // Check if user is the car owner
    if (car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view offers for this car",
      })
    }

    const { status, page = 1, limit = 10 } = req.query
    const query = { car: req.params.carId }

    if (status) query.status = status

    const offers = await Offer.find(query)
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

// @desc    Get user's offers
// @route   GET /api/offers/my-offers
// @access  Private
const getUserOffers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const query = { buyer: req.user._id }

    if (status) query.status = status

    const offers = await Offer.find(query)
      .populate("car", "title price images")
      .populate("seller", "name phone")
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

// @desc    Respond to offer
// @route   PUT /api/offers/:id/respond
// @access  Private
const respondToOffer = async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body

    const offer = await Offer.findById(id)
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" })
    }

    offer.status = action
    await offer.save()

    res.json({ message: "Offer response updated", offer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Add negotiation message
// @route   PUT /api/offers/:id/negotiate
// @access  Private
const addNegotiation = async (req, res) => {
  try {
    const { id } = req.params
    const { message, amount } = req.body

    const offer = await Offer.findById(id)
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" })
    }

    offer.negotiations.push({
      sender: req.user.id,
      message,
      amount,
    })

    await offer.save()
    res.json({ message: "Negotiation added", offer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  makeOffer,
  getCarOffers,
  getUserOffers,
  respondToOffer,
  addNegotiation,
}

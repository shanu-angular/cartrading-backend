const Car = require("../../car/models/Car")
const SellerListing = require("../models/SellerListing")
const Seller = require("../models/Seller")

// @desc    Get seller's listed cars
// @route   GET /api/sellers/cars/my-listed-cars
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
    if (status) query.isActive = status === "active"

    const cars = await Car.find(query)
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    // Get listing information for each car
    const carsWithListingInfo = await Promise.all(
      cars.map(async (car) => {
        const listing = await SellerListing.findOne({ car: car._id })
        return {
          ...car.toObject(),
          listingInfo: listing
            ? {
                plan: listing.listingPlan,
                status: listing.listingStatus,
                expiryDate: listing.expiryDate,
                views: listing.views,
                inquiries: listing.inquiries,
                bids: listing.bids,
              }
            : null,
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

// @desc    Edit car listing
// @route   GET /api/sellers/cars/:id/edit
// @access  Private (Seller only)
const getCarForEdit = async (req, res) => {
  try {
    const sellerId = req.user._id

    const car = await Car.findById(req.params.id)

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    // Check ownership
    if (car.owner.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this car",
      })
    }

    // Get listing information
    const listing = await SellerListing.findOne({ car: car._id })

    res.json({
      success: true,
      data: {
        car,
        listing,
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

// @desc    Update car listing
// @route   PUT /api/sellers/cars/:id/edit
// @access  Private (Seller only)
const updateCarListing = async (req, res) => {
  try {
    const sellerId = req.user._id

    let car = await Car.findById(req.params.id)

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    // Check ownership
    if (car.owner.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this car",
      })
    }

    car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.json({
      success: true,
      data: car,
      message: "Car listing updated successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Cancel car listing
// @route   PUT /api/sellers/cars/:id/cancel
// @access  Private (Seller only)
const cancelCarListing = async (req, res) => {
  try {
    const sellerId = req.user._id

    const car = await Car.findById(req.params.id)

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    // Check ownership
    if (car.owner.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this listing",
      })
    }

    // Deactivate car
    car.isActive = false
    await car.save()

    // Update listing status
    const listing = await SellerListing.findOne({ car: car._id })
    if (listing) {
      listing.listingStatus = "cancelled"
      await listing.save()
    }

    res.json({
      success: true,
      data: car,
      message: "Car listing cancelled successfully",
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
  getCarForEdit,
  updateCarListing,
  cancelCarListing,
}

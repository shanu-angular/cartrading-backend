const SellerListing = require("../models/SellerListing")
const Seller = require("../models/Seller")
const Car = require("../../car/models/Car")
const { validationResult } = require("express-validator")

// Pricing plans configuration
const LISTING_PLANS = {
  free: {
    duration: 2, // weeks
    photoLimit: 1,
    videoAllowed: false,
    price: 0,
  },
  standard: {
    duration: 4,
    photoLimit: 10,
    videoAllowed: false,
    price: 25,
  },
  enhanced: {
    duration: 8,
    photoLimit: 20,
    videoAllowed: false,
    price: 55,
  },
  deluxe: {
    duration: 52,
    photoLimit: 40,
    videoAllowed: true,
    videoLimit: 1,
    price: 70,
  },
}

const PREMIUM_FEATURES = {
  thickBorders: 15,
  topOfList: 15,
  showOnTop: 20,
  colorBackground: 10,
  auctionEnabled: 25,
}

// @desc    Get listing plans
// @route   GET /api/sellers/listing/plans
// @access  Public
const getListingPlans = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        plans: LISTING_PLANS,
        premiumFeatures: PREMIUM_FEATURES,
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

// @desc    Step 1: Vehicle Details (matching your form)
const createVehicleDetails = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const sellerId = req.user._id
    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    const {
      // Basic Info
      listingTitle,
      vin,
      year,
      make,
      model,
      bodyStyle,

      // Details
      exteriorColor,
      interiorColor,
      doors,
      engine,
      fuelType,
      transmission,
      mileage,

      // Pricing
      price,
      description,

      // Condition
      condition,
      accidentHistory,
      serviceHistory,

      // Features
      features,
    } = req.body

    // Create car entry
    const car = await Car.create({
      title: listingTitle,
      make,
      model,
      year,
      price,
      mileage,
      fuelType,
      transmission,
      bodyType: bodyStyle,
      color: exteriorColor,
      city: seller.user?.city || "Not specified",
      description,
      condition,
      owner: sellerId,
      ownerType: "seller",
      features: features || [],
      images: [], // Will be added in step 2
      // Additional fields
      vin,
      doors,
      interiorColor,
      engine,
      accidentHistory,
      serviceHistory,
      isActive: false, // Will be activated after payment
    })

    res.status(201).json({
      success: true,
      data: {
        carId: car._id,
        step: 1,
        nextStep: "photos",
        progress: "16.67%", // 1/6 steps
      },
      message: "Vehicle details saved successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Step 2: Upload Photos (matching your photo upload UI)
const uploadPhotos = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { images, mainImageIndex = 0 } = req.body

    const car = await Car.findById(req.params.carId)
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

    // Validate images array
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      })
    }

    // Reorder images to put main image first
    const reorderedImages = [...images]
    if (mainImageIndex > 0 && mainImageIndex < images.length) {
      const mainImage = reorderedImages.splice(mainImageIndex, 1)[0]
      reorderedImages.unshift(mainImage)
    }

    car.images = reorderedImages
    await car.save()

    res.json({
      success: true,
      data: {
        carId: car._id,
        step: 2,
        nextStep: "review-ad",
        progress: "33.33%", // 2/6 steps
      },
      message: "Photos uploaded successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Step 3: Review Ad (matching your review UI)
const reviewAdDetails = async (req, res) => {
  try {
    const sellerId = req.user._id
    const car = await Car.findById(req.params.carId).populate("owner", "name phone email")

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    // Check ownership
    if (car.owner._id.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this car",
      })
    }

    res.json({
      success: true,
      data: {
        car,
        step: 3,
        nextStep: "review-listing",
        progress: "50%", // 3/6 steps
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

// @desc    Step 4: Review Listing with Plan Selection (matching your pricing UI)
const reviewListing = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { planType, premiumFeatures } = req.body

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    const car = await Car.findById(req.params.carId)
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

    // Calculate pricing exactly as shown in your UI
    const planDetails = LISTING_PLANS[planType]
    if (!planDetails) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan type",
      })
    }

    let premiumFeatureCost = 0
    const selectedFeatures = {}

    if (premiumFeatures) {
      Object.keys(premiumFeatures).forEach((feature) => {
        if (premiumFeatures[feature] && PREMIUM_FEATURES[feature]) {
          premiumFeatureCost += PREMIUM_FEATURES[feature]
          selectedFeatures[feature] = true
        }
      })
    }

    const subtotal = planDetails.price + premiumFeatureCost
    const tax = subtotal * 0.15 // 15% VAT as shown in your UI
    const totalCost = subtotal + tax

    // Calculate expiry date
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + planDetails.duration * 7)

    // Create or update listing
    let listing = await SellerListing.findOne({ car: car._id })

    if (listing) {
      listing.listingPlan = planType
      listing.planDetails = planDetails
      listing.premiumFeatures = selectedFeatures
      listing.pricing = {
        basePlan: planDetails.price,
        premiumFeatureCost,
        subtotal,
        tax,
        totalCost,
        currency: "SAR",
      }
      listing.expiryDate = expiryDate
    } else {
      listing = await SellerListing.create({
        seller: seller._id,
        car: car._id,
        listingPlan: planType,
        planDetails,
        premiumFeatures: selectedFeatures,
        pricing: {
          basePlan: planDetails.price,
          premiumFeatureCost,
          subtotal,
          tax,
          totalCost,
          currency: "SAR",
        },
        expiryDate,
      })
    }

    await listing.save()

    res.json({
      success: true,
      data: {
        listing,
        car,
        step: 4,
        nextStep: "checkout",
        progress: "66.67%", // 4/6 steps
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

// @desc    Step 5: Checkout (matching your checkout UI)
const processCheckout = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { billingInfo, paymentMethod, savedPaymentFormId, newPaymentDetails } = req.body

    const listing = await SellerListing.findById(req.params.listingId).populate("car")

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      })
    }

    const seller = await Seller.findById(listing.seller)
    if (seller.user.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to process this payment",
      })
    }

    // Update billing info
    listing.billingInfo = billingInfo

    // Process payment (simulate for now)
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    listing.paymentStatus = "completed"
    listing.paymentDetails = {
      transactionId,
      paymentMethod,
      paymentDate: new Date(),
      amount: listing.pricing.totalCost,
    }
    listing.listingStatus = "active"

    // Activate the car listing
    listing.car.isActive = true
    await listing.car.save()
    await listing.save()

    res.json({
      success: true,
      data: {
        listing,
        transactionId,
        step: 5,
        nextStep: "confirmation",
        progress: "83.33%", // 5/6 steps
      },
      message: "Payment processed successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Step 6: Payment Complete (matching your confirmation UI)
const getPaymentConfirmation = async (req, res) => {
  try {
    const sellerId = req.user._id
    const listing = await SellerListing.findById(req.params.listingId).populate("car")

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      })
    }

    const seller = await Seller.findById(listing.seller)
    if (seller.user.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this confirmation",
      })
    }

    res.json({
      success: true,
      data: {
        listing,
        step: 6,
        completed: true,
        progress: "100%", // 6/6 steps
        carUrl: `/cars/${listing.car._id}`,
        listingId: listing._id,
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

// @desc    Get seller's listings
// @route   GET /api/sellers/listing/my-listings
// @access  Private (Seller only)
const getSellerListings = async (req, res) => {
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

    const query = { seller: seller._id }
    if (status) query.listingStatus = status

    const listings = await SellerListing.find(query)
      .populate("car", "title images make model year price")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await SellerListing.countDocuments(query)

    res.json({
      success: true,
      data: listings,
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
  getListingPlans,
  createVehicleDetails,
  uploadPhotos,
  reviewAdDetails,
  reviewListing,
  processCheckout, // Fixed: was processPayment
  getPaymentConfirmation,
  getSellerListings,
}

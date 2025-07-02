const Car = require("../models/Car")
const { validationResult } = require("express-validator")

// @desc    Get all cars with filters
// @route   GET /api/cars
// @access  Public
const getCars = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      make,
      model,
      minPrice,
      maxPrice,
      year,
      city,
      fuelType,
      transmission,
      bodyType,
      search,
      sort = "-createdAt",
    } = req.query

    // Build query
    const query = { isActive: true }

    if (make) query.make = new RegExp(make, "i")
    if (model) query.model = new RegExp(model, "i")
    if (city) query.city = new RegExp(city, "i")
    if (fuelType) query.fuelType = fuelType
    if (transmission) query.transmission = transmission
    if (bodyType) query.bodyType = bodyType
    if (year) query.year = year

    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number.parseInt(minPrice)
      if (maxPrice) query.price.$lte = Number.parseInt(maxPrice)
    }

    if (search) {
      query.$text = { $search: search }
    }

    // Execute query
    const cars = await Car.find(query)
      .populate("owner", "name phone city")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Car.countDocuments(query)

    res.json({
      success: true,
      data: cars,
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

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
const getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate("owner", "name phone city email")

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    // Increment views
    car.views += 1
    await car.save()

    res.json({
      success: true,
      data: car,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Create new car listing
// @route   POST /api/cars
// @access  Private
const createCar = async (req, res) => {
  try {
    const {
      title,
      make,
      model,
      year,
      price,
      mileage,
      fuelType,
      transmission,
      bodyType,
      color,
      condition,
      description,
      city,
      state,
      features
    } = req.body

    const images = req.files ? req.files.map(file => file.path) : []

    const car = new Car({
      title,
      make,
      model,
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage),
      fuelType,
      transmission,
      bodyType,
      color,
      condition,
      description,
      city,
      state,
      features: features ? JSON.parse(features) : [],
      images,
      owner: req.user.id, // Taken from token
      ownerType: req.user.role // Supplied in form-data
    })

    await car.save()
    await car.populate("owner", "name email phone")

    res.status(201).json({
      message: "Car listing created successfully",
      car
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}


// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private
const updateCar = async (req, res) => {
  try {
    let car = await Car.findById(req.params.id)

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    // Check ownership
    if (car.owner.toString() !== req.user._id.toString()) {
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
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private
const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    // Check ownership
    if (car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this car",
      })
    }

    await Car.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Car deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get featured cars
// @route   GET /api/cars/featured
// @access  Public
const getFeaturedCars = async (req, res) => {
  try {
    const cars = await Car.find({ isActive: true, isFeatured: true })
      .populate("owner", "name phone city")
      .sort("-createdAt")
      .limit(8)

    res.json({
      success: true,
      data: cars,
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
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  getFeaturedCars,
}

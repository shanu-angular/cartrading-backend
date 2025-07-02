const express = require("express")
const { body, validationResult, query } = require("express-validator")
const CarMaker = require("../models/CarMaker")
const CarModel = require("../models/CarModel")
// const dealerAuth  = require("../../../middleware/dealerAuth")

const router = express.Router()

// Get all car makers
router.get("/",async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const page = Number.parseInt(req.query.page) || 1
      const limit = Number.parseInt(req.query.limit) || 50
      const skip = (page - 1) * limit

      // Build filter object
      const filter = { isActive: true }

      if (req.query.search) {
        filter.name = new RegExp(req.query.search, "i")
      }

      const makers = await CarMaker.find(filter).sort({ name: 1 }).skip(skip).limit(limit)

      const total = await CarMaker.countDocuments(filter)

      res.json({
        success: true,
        data: makers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error("Car makers fetch error:", error)
      res.status(500).json({
        success: false,
        message: "Server error fetching car makers",
      })
    }
  },
)

// Get single car maker
router.get("/:id", async (req, res) => {
  try {
    const maker = await CarMaker.findById(req.params.id)

    if (!maker) {
      return res.status(404).json({
        success: false,
        message: "Car maker not found",
      })
    }

    res.json({
      success: true,
      data: maker,
    })
  } catch (error) {
    console.error("Car maker fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching car maker",
    })
  }
})

// Create car maker (Admin only)
router.post(
  "/",
  // dealerAuth,
  
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const maker = new CarMaker(req.body)
      await maker.save()

      res.status(201).json({
        success: true,
        message: "Car maker created successfully",
        data: maker,
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Car maker with this name already exists",
        })
      }
      console.error("Car maker creation error:", error)
      res.status(500).json({
        success: false,
        message: "Server error creating car maker",
      })
    }
  },
)

// Update car maker (Admin only)
router.put("/:id", async (req, res) => {
  try {
    const maker = await CarMaker.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!maker) {
      return res.status(404).json({
        success: false,
        message: "Car maker not found",
      })
    }

    res.json({
      success: true,
      message: "Car maker updated successfully",
      data: maker,
    })
  } catch (error) {
    console.error("Car maker update error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating car maker",
    })
  }
})

// Delete car maker (Admin only)
router.delete("/:id",async (req, res) => {
  try {
    const maker = await CarMaker.findByIdAndDelete(req.params.id)

    if (!maker) {
      return res.status(404).json({
        success: false,
        message: "Car maker not found",
      })
    }

    res.json({
      success: true,
      message: "Car maker deleted successfully",
    })
  } catch (error) {
    console.error("Car maker deletion error:", error)
    res.status(500).json({
      success: false,
      message: "Server error deleting car maker",
    })
  }
})

// Get car models by maker ID
router.get("/:makerId/models", async (req, res) => {
  try {
    const { makerId } = req.params
console.log("Fetching models for maker ID:", makerId)
    // Check if maker exists
    const maker = await CarMaker.findById(makerId)
    if (!maker) {
      return res.status(404).json({
        success: false,
        message: "Car maker not found",
      })
    }

    const models = await CarModel.find({ maker: makerId, isActive: true })
      .populate("maker", "name logo")
      .sort({ name: 1 })
console.log("Models fetched for maker:", models)
    res.json({
      success: true,
      data: models,
      maker: {
        _id: maker._id,
        name: maker.name,
        logo: maker.logo,
      },
    })
  } catch (error) {
    console.error("Car models fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching car models",
    })
  }
})

module.exports = router

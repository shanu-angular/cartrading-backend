const express = require("express")
const { body, validationResult, query } = require("express-validator")
const CarModel = require("../models/CarModel")
const CarMaker = require("../models/CarMaker")
// const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Get all car models
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("maker").optional().isMongoId().withMessage("Invalid maker ID"),
    query("search").optional().trim().isLength({ min: 1 }).withMessage("Search term must not be empty"),
  ],
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

      const page = Number.parseInt(req.query.page) || 1
      const limit = Number.parseInt(req.query.limit) || 50
      const skip = (page - 1) * limit

      // Build filter object
      const filter = { isActive: true }

      if (req.query.maker) {
        filter.maker = req.query.maker
      }

      if (req.query.search) {
        filter.name = new RegExp(req.query.search, "i")
      }

      const models = await CarModel.find(filter)
        .populate("maker", "name")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)

      const total = await CarModel.countDocuments(filter)

      res.json({
        success: true,
        data: models,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error("Car models fetch error:", error)
      res.status(500).json({
        success: false,
        message: "Server error fetching car models",
      })
    }
  },
)

// Get single car model
router.get("/:id", async (req, res) => {
  try {
    const model = await CarModel.findById(req.params.id).populate("maker", "name logo country")

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Car model not found",
      })
    }

    res.json({
      success: true,
      data: model,
    })
  } catch (error) {
    console.error("Car model fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching car model",
    })
  }
})

// Create car model (Admin only)
router.post(
  "/",
  // auth,
  // authorize("admin"),
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("maker").isMongoId().withMessage("Valid maker ID is required"),
  ],
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

      // Check if maker exists
      const maker = await CarMaker.findById(req.body.maker)
      if (!maker) {
        return res.status(400).json({
          success: false,
          message: "Car maker not found",
        })
      }

      const model = new CarModel(req.body)
      await model.save()

      const populatedModel = await CarModel.findById(model._id).populate("maker", "name logo country")

      res.status(201).json({
        success: true,
        message: "Car model created successfully",
        data: populatedModel,
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Car model with this name already exists for this maker",
        })
      }
      console.error("Car model creation error:", error)
      res.status(500).json({
        success: false,
        message: "Server error creating car model",
      })
    }
  },
)

// Update car model (Admin only)
router.put("/:id", async (req, res) => {
  try {
    const model = await CarModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("maker", "name logo country")

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Car model not found",
      })
    }

    res.json({
      success: true,
      message: "Car model updated successfully",
      data: model,
    })
  } catch (error) {
    console.error("Car model update error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating car model",
    })
  }
})

// Delete car model (Admin only)
router.delete("/:id", async (req, res) => {
  try {
    const model = await CarModel.findByIdAndDelete(req.params.id)

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Car model not found",
      })
    }

    res.json({
      success: true,
      message: "Car model deleted successfully",
    })
  } catch (error) {
    console.error("Car model deletion error:", error)
    res.status(500).json({
      success: false,
      message: "Server error deleting car model",
    })
  }
})

module.exports = router

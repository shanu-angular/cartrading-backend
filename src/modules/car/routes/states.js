const express = require("express")
const { body, validationResult, query } = require("express-validator")
const State = require("../models/State")
const City = require("../models/City")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Get all states
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("country").optional().trim().isLength({ min: 1 }).withMessage("Country must not be empty"),
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

      if (req.query.country) {
        filter.country = new RegExp(req.query.country, "i")
      }

      if (req.query.search) {
        filter.name = new RegExp(req.query.search, "i")
      }

      const states = await State.find(filter).sort({ name: 1 }).skip(skip).limit(limit)

      const total = await State.countDocuments(filter)

      res.json({
        success: true,
        data: states,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error("States fetch error:", error)
      res.status(500).json({
        success: false,
        message: "Server error fetching states",
      })
    }
  },
)

// Get single state
router.get("/:id", async (req, res) => {
  try {
    const state = await State.findById(req.params.id)

    if (!state) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      })
    }

    res.json({
      success: true,
      data: state,
    })
  } catch (error) {
    console.error("State fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching state",
    })
  }
})

// Create state (Admin only)
router.post(
  "/",
  auth,
  authorize("admin"),
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("code").trim().isLength({ min: 2, max: 10 }).withMessage("Code must be between 2 and 10 characters"),
    body("country").optional().trim().isLength({ min: 1 }).withMessage("Country must not be empty"),
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

      const state = new State(req.body)
      await state.save()

      res.status(201).json({
        success: true,
        message: "State created successfully",
        data: state,
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "State with this code already exists",
        })
      }
      console.error("State creation error:", error)
      res.status(500).json({
        success: false,
        message: "Server error creating state",
      })
    }
  },
)

// Update state (Admin only)
router.put("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const state = await State.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!state) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      })
    }

    res.json({
      success: true,
      message: "State updated successfully",
      data: state,
    })
  } catch (error) {
    console.error("State update error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating state",
    })
  }
})

// Delete state (Admin only)
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const state = await State.findByIdAndDelete(req.params.id)

    if (!state) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      })
    }

    res.json({
      success: true,
      message: "State deleted successfully",
    })
  } catch (error) {
    console.error("State deletion error:", error)
    res.status(500).json({
      success: false,
      message: "Server error deleting state",
    })
  }
})

// Get cities by state ID
router.get("/:stateId/cities", async (req, res) => {
  try {
    const { stateId } = req.params

    // Check if state exists
    const state = await State.findById(stateId)
    if (!state) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      })
    }

    const cities = await City.find({ state: stateId, isActive: true }).populate("state", "name code").sort({ name: 1 })

    res.json({
      success: true,
      data: cities,
      state: {
        _id: state._id,
        name: state.name,
        code: state.code,
        country: state.country,
      },
    })
  } catch (error) {
    console.error("Cities fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching cities",
    })
  }
})

module.exports = router

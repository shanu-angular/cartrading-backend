const express = require("express");
const { body, validationResult, query } = require("express-validator");
const City = require("../models/City");

const router = express.Router();

// Get all cities
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("search").optional().trim().isLength({ min: 1 }).withMessage("Search term must not be empty"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const page = Number.parseInt(req.query.page) || 1;
      const limit = Number.parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const filter = { isActive: true };

      if (req.query.search) {
        filter.name = new RegExp(req.query.search, "i");
      }

      const cities = await City.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      const total = await City.countDocuments(filter);

      res.json({
        success: true,
        data: cities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Cities fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Server error fetching cities",
      });
    }
  }
);

// Get single city
router.get("/:id", async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    res.json({
      success: true,
      data: city,
    });
  } catch (error) {
    console.error("City fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching city",
    });
  }
});

// Create city (no state)
router.post(
  "/",
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const city = new City(req.body);
      await city.save();

      res.status(201).json({
        success: true,
        message: "City created successfully",
        data: city,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "City with this name already exists",
        });
      }
      console.error("City creation error:", error);
      res.status(500).json({
        success: false,
        message: "Server error creating city",
      });
    }
  }
);

// Update city
router.put("/:id", async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    res.json({
      success: true,
      message: "City updated successfully",
      data: city,
    });
  } catch (error) {
    console.error("City update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating city",
    });
  }
});

// Delete city
router.delete("/:id", async (req, res) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    res.json({
      success: true,
      message: "City deleted successfully",
    });
  } catch (error) {
    console.error("City deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting city",
    });
  }
});

module.exports = router;

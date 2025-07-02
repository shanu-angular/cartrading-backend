const express = require("express");
const router = express.Router();
const CarSettings = require("../models/CarSettings");

// ✅ Create or update car price range
router.post("/car-price-settings", async (req, res) => {
  try {
    const { minPrice, maxPrice, ownerType, bodyType } = req.body;

    const settings = await CarSettings.create({
      minPrice,
      maxPrice,
      ownerType,
      bodyType,
    });

    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

// ✅ Get current min & max car price
router.get("/car-price-settings", async (req, res) => {
  try {
    const settings = await CarSettings.find();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});


module.exports = router;

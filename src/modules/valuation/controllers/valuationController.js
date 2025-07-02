const CarValuation = require("../models/CarValuation")
const { validationResult } = require("express-validator")

// Get car valuation
const getCarValuation = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { make, model, year, mileage, condition, location } = req.body

    // Simple valuation logic (in real app, this would be more complex)
    let baseValue = 20000 // Base value

    // Adjust for year
    const currentYear = new Date().getFullYear()
    const age = currentYear - year
    baseValue -= age * 1000

    // Adjust for mileage
    baseValue -= (mileage / 1000) * 100

    // Adjust for condition
    const conditionMultiplier = {
      Excellent: 1.1,
      Good: 1.0,
      Fair: 0.8,
      Poor: 0.6,
    }
    baseValue *= conditionMultiplier[condition] || 1.0

    const valuation = new CarValuation({
      user: req.user.id,
      make,
      model,
      year,
      mileage,
      condition,
      location,
      estimatedValue: Math.max(baseValue, 1000), // Minimum value
    })

    await valuation.save()
    res.json({ message: "Valuation completed", valuation })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get valuation history
const getValuationHistory = async (req, res) => {
  try {
    const valuations = await CarValuation.find({ user: req.user.id }).sort({ createdAt: -1 })
    res.json(valuations)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get market trends
const getMarketTrends = async (req, res) => {
  try {
    const { make, model, year } = req.params

    // Mock market trends data
    const trends = {
      make,
      model,
      year: Number.parseInt(year),
      averagePrice: 25000,
      priceRange: { min: 20000, max: 30000 },
      marketTrend: "stable",
      demandLevel: "medium",
    }

    res.json(trends)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  getCarValuation,
  getValuationHistory,
  getMarketTrends,
}

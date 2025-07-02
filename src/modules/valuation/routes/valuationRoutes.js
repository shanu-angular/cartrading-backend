const express = require("express")
const { body } = require("express-validator")
const { getCarValuation, getValuationHistory, getMarketTrends } = require("../controllers/valuationController")
const auth = require("../../../middleware/auth")

const router = express.Router()

// Validation rules
const valuationValidation = [
  body("make").notEmpty().withMessage("Car make is required"),
  body("model").notEmpty().withMessage("Car model is required"),
  body("year")
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage("Valid year is required"),
  body("mileage").isInt({ min: 0 }).withMessage("Valid mileage is required"),
]

// Routes
router.post("/estimate", valuationValidation, getCarValuation)
router.get("/history", auth, getValuationHistory)
router.get("/market-trends", getMarketTrends)

module.exports = router

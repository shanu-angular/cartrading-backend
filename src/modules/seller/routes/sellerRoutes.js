const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const {
  createSellerProfile,
  getSellerProfile,
  getSellerCars,
  updateSellerProfile,
} = require("../controllers/sellerController")
const { auth } = require("../../../middleware/auth")

// Validation middleware
const sellerProfileValidation = [
  body("businessName").notEmpty().withMessage("Business name is required"),
  body("businessAddress").notEmpty().withMessage("Business address is required"),
  body("businessPhone").notEmpty().withMessage("Business phone is required"),
]

// All routes are authed
router.use(auth)

// Seller profile routes
router.post("/profile", sellerProfileValidation, createSellerProfile)
router.get("/profile", getSellerProfile)
router.put("/profile", updateSellerProfile)
router.get("/cars", getSellerCars)

module.exports = router

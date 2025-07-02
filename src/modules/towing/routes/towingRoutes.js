const express = require("express")
const { body } = require("express-validator")
const {
  registerTowing,
  loginTowing,
  getTowingProfile,
  updateTowingProfile,
} = require("../controllers/towingController")
const { getTowingBilling, createBillingRecord, updateBillingRecord } = require("../controllers/towingBillingController")
const { createTowingProfile, updateTowingBusinessProfile } = require("../controllers/towingProfileController")
const {
  getTransportRequests,
  createTransportRequest,
  updateTransportRequest,
  completeTransportRequest,
} = require("../controllers/transportRequestController")
const towingAuth = require("../../../middleware/towingAuth")

const router = express.Router()

// Validation rules
const towingValidation = [
  body("businessName").notEmpty().withMessage("Business name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
]

// Auth routes
router.post("/register", towingValidation, registerTowing)
router.post("/login", loginTowing)

// Profile routes
router.get("/profile", towingAuth, getTowingProfile)
router.put("/profile", towingAuth, updateTowingProfile)
router.post("/profile/create", towingAuth, createTowingProfile)
router.put("/profile/business", towingAuth, updateTowingBusinessProfile)

// Transport request routes
router.get("/requests", towingAuth, getTransportRequests)
router.post("/requests", towingAuth, createTransportRequest)
router.put("/requests/:id", towingAuth, updateTransportRequest)
router.put("/requests/:id/complete", towingAuth, completeTransportRequest)

// Billing routes
router.get("/billing", towingAuth, getTowingBilling)
router.post("/billing", towingAuth, createBillingRecord)
router.put("/billing/:id", towingAuth, updateBillingRecord)

module.exports = router

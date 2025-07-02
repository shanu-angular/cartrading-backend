const express = require("express")
const { body } = require("express-validator")

// Import controllers - ONLY functions that actually exist
const {
  registerDealer,
  loginDealer,
  getDealerProfile,
  updateDealerProfile,
  createDealerProfile,
} = require("../controllers/dealerController")

const { getDealerDashboard, getDealerStats, getDealerPerformance } = require("../controllers/dealerDashboardController")

const {
  getDealerLots,
  createDealerLot,
  getDealerLot,
  updateDealerLot,
  deleteDealerLot,
} = require("../controllers/dealerLotController")

const {
  getDealerBilling,
  createBillingRecord,
  updateBillingRecord,
  markBillingAsPaid,
  getBillingSummary,
} = require("../controllers/dealerBillingController")

const {auth} = require("../../../middleware/auth")
const dealerAuth = require("../../../middleware/dealerAuth")

const router = express.Router()

// Validation rules
const dealerRegistrationValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("businessName").trim().isLength({ min: 2 }).withMessage("Business name is required"),
  body("businessAddress").trim().isLength({ min: 5 }).withMessage("Business address is required"),
  body("licenseNumber").trim().isLength({ min: 5 }).withMessage("License number is required"),
]

const dealerLoginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").exists().withMessage("Password is required"),
]

const dealerProfileValidation = [
  body("businessName").trim().isLength({ min: 2 }).withMessage("Business name is required"),
  body("businessAddress").trim().isLength({ min: 5 }).withMessage("Business address is required"),
  body("licenseNumber").trim().isLength({ min: 5 }).withMessage("License number is required"),
]

const lotValidation = [
  body("lotName").trim().isLength({ min: 2 }).withMessage("Lot name is required"),
  body("brandsOffered").isArray({ min: 1 }).withMessage("At least one brand must be specified"),
  body("subscriptionPlan").isIn(["basic", "premium", "enterprise"]).withMessage("Invalid subscription plan"),
]

const profileUpdateValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
  body("businessName").trim().isLength({ min: 2 }).withMessage("Business name is required"),
]

// Public routes
router.post("/register", dealerRegistrationValidation, registerDealer)
router.post("/login", dealerLoginValidation, loginDealer)

// authed routes - Basic profile
router.get("/profile", auth , getDealerProfile)
router.put("/profile", auth , profileUpdateValidation, updateDealerProfile)
router.post("/profile/create", auth , dealerProfileValidation, createDealerProfile)

// authed routes - Dashboard (requires dealer role)
router.get("/dashboard", auth , dealerAuth, getDealerDashboard)
router.get("/stats", auth , dealerAuth, getDealerStats)
router.get("/performance", auth , dealerAuth, getDealerPerformance)

// authed routes - Lot management
router.get("/lots", auth , dealerAuth, getDealerLots)
router.post("/lots", auth , dealerAuth, lotValidation, createDealerLot)
router.get("/lots/:id", auth , dealerAuth, getDealerLot)
router.put("/lots/:id", auth , dealerAuth, updateDealerLot)
router.delete("/lots/:id", auth , dealerAuth, deleteDealerLot)

// authed routes - Billing
router.get("/billing", auth , dealerAuth, getDealerBilling)
router.post("/billing", auth , createBillingRecord) // Admin only
router.put("/billing/:id", auth , dealerAuth, updateBillingRecord)
router.put("/billing/:id/pay", auth , dealerAuth, markBillingAsPaid)
router.get("/billing/summary", auth , dealerAuth, getBillingSummary)

module.exports = router

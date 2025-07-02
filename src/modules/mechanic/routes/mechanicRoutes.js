const express = require("express")
const { body } = require("express-validator")
const {
  registerMechanic,
  loginMechanic,
  getMechanicProfile,
  updateMechanicProfile,
} = require("../controllers/mechanicController")
const {
  getInspectionRequests,
  createInspection,
  updateInspection,
  completeInspection,
} = require("../controllers/mechanicInspectionController")
const {
  getMechanicBilling,
  createBillingRecord,
  updateBillingRecord,
} = require("../controllers/mechanicBillingController")
const { createMechanicProfile, updateMechanicBusinessProfile } = require("../controllers/mechanicProfileController")
const mechanicAuth = require("../../../middleware/mechanicAuth")

const router = express.Router()

// Validation rules
const mechanicValidation = [
  body("businessName").notEmpty().withMessage("Business name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
]

// Auth routes
router.post("/register", mechanicValidation, registerMechanic)
router.post("/login", loginMechanic)

// Profile routes
router.get("/profile", mechanicAuth, getMechanicProfile)
router.put("/profile", mechanicAuth, updateMechanicProfile)
router.post("/profile/create", mechanicAuth, createMechanicProfile)
router.put("/profile/business", mechanicAuth, updateMechanicBusinessProfile)

// Inspection routes
router.get("/inspections", mechanicAuth, getInspectionRequests)
router.post("/inspections", mechanicAuth, createInspection)
router.put("/inspections/:id", mechanicAuth, updateInspection)
router.put("/inspections/:id/complete", mechanicAuth, completeInspection)

// Billing routes
router.get("/billing", mechanicAuth, getMechanicBilling)
router.post("/billing", mechanicAuth, createBillingRecord)
router.put("/billing/:id", mechanicAuth, updateBillingRecord)

module.exports = router

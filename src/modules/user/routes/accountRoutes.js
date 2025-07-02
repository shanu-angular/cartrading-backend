const express = require("express")
const router = express.Router()
const {
  getAccountDashboard,
  updateAccountProfile,
  changePassword,
  getMyBids,
  getMyOffers,
} = require("../controllers/accountController")
const { protect } = require("../../../middleware/auth")
const { body } = require("express-validator")

// Account management routes
router.get("/dashboard", protect, getAccountDashboard)
router.put(
  "/profile",
  protect,
  [
    body("email").optional().isEmail().withMessage("Please provide a valid email"),
    body("phone").optional().isMobilePhone().withMessage("Please provide a valid phone number"),
  ],
  updateAccountProfile,
)
router.put(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  changePassword,
)
router.get("/my-bids", protect, getMyBids)
router.get("/my-offers", protect, getMyOffers)

module.exports = router

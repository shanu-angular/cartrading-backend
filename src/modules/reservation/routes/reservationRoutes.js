const express = require("express")
const { body } = require("express-validator")
const { createReservation, getUserReservations, cancelReservation } = require("../controllers/reservationController")
const auth = require("../../../middleware/auth")

const router = express.Router()

// Validation rules
const reservationValidation = [
  body("reservationDate").isISO8601().withMessage("Valid reservation date is required"),
  body("timeSlot").notEmpty().withMessage("Time slot is required"),
]

// Routes
router.post("/car/:carId", auth, reservationValidation, createReservation)
router.get("/my-reservations", auth, getUserReservations)
router.put("/:id/cancel", auth, cancelReservation)

module.exports = router

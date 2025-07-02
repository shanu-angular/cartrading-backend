const Reservation = require("../models/Reservation")
const Car = require("../../car/models/Car")
const { validationResult } = require("express-validator")

// Create reservation
const createReservation = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { carId } = req.params
    const { reservationType, scheduledDate, scheduledTime, location } = req.body

    const car = await Car.findById(carId)
    if (!car) {
      return res.status(404).json({ message: "Car not found" })
    }

    const reservation = new Reservation({
      car: carId,
      user: req.user.id,
      reservationType,
      scheduledDate,
      scheduledTime,
      location,
    })

    await reservation.save()
    res.status(201).json({ message: "Reservation created successfully", reservation })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get user reservations
const getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate("car", "make model year")
      .sort({ createdAt: -1 })
    res.json(reservations)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Cancel reservation
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params
    const reservation = await Reservation.findById(id)

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" })
    }

    if (reservation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" })
    }

    reservation.status = "cancelled"
    await reservation.save()

    res.json({ message: "Reservation cancelled successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  createReservation,
  getUserReservations,
  cancelReservation,
}

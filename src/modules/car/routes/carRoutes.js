const express = require("express")
const router = express.Router()
const { getCars, getCar, createCar, updateCar, deleteCar, getFeaturedCars } = require("../controllers/carController")
const { auth } = require("../../../middleware/auth")
const dealerAuth = require("../../../middleware/dealerAuth")
const upload = require("../../../middleware/upload")
// Public routes
router.get("/", getCars)
router.get("/featured", getFeaturedCars)
router.get("/:id", getCar)

// authed routes
router.post("/create", auth,dealerAuth,upload.array("images", 10), createCar)
router.put("/:id", auth, updateCar)
router.delete("/:id", auth, deleteCar)

module.exports = router

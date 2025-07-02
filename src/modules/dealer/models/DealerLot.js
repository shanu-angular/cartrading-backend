const mongoose = require("mongoose")

const dealerLotSchema = new mongoose.Schema(
  {
    dealer: {
      type: mongoose.Schema.ObjectId,
      ref: "Dealer",
      required: true,
    },
    lotName: {
      type: String,
      required: [true, "Please add lot name"],
      trim: true,
    },
    image: {
      type: String,
      default: "default-lot.jpg",
    },
    brandsOffered: [
      {
        type: String,
        required: true,
      },
    ],
    subscriptionPlan: {
      type: String,
      enum: ["basic", "premium", "enterprise"],
      required: true,
    },
    assignedManager: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    showroomLocations: [
      {
        address: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        zipcode: {
          type: String,
          required: true,
        },
        phone: String,
        isMain: {
          type: Boolean,
          default: false,
        },
      },
    ],
    capacity: {
      maxCars: {
        type: Number,
        default: 50,
      },
      currentCars: {
        type: Number,
        default: 0,
      },
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    amenities: [
      {
        type: String,
        enum: [
          "Customer Lounge",
          "Service Center",
          "Parts Department",
          "Financing Office",
          "Car Wash",
          "Parking",
          "WiFi",
          "Coffee Bar",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    establishedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
dealerLotSchema.index({ dealer: 1 })
dealerLotSchema.index({ "showroomLocations.city": 1 })

module.exports = mongoose.model("DealerLot", dealerLotSchema)

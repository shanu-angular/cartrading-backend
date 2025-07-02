const mongoose = require("mongoose")

const towingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: [true, "Please add company name"],
      trim: true,
    },
    companyAddress: {
      type: String,
      required: [true, "Please add company address"],
    },
    companyPhone: {
      type: String,
      required: [true, "Please add company phone"],
    },
    licenseNumber: {
      type: String,
      required: [true, "Please add license number"],
      unique: true,
    },
    services: [
      {
        type: String,
        enum: [
          "Emergency Towing",
          "Roadside Assistance",
          "Jump Start",
          "Tire Change",
          "Lockout Service",
          "Fuel Delivery",
        ],
      },
    ],
    vehicleTypes: [
      {
        type: String,
        enum: ["Car", "Motorcycle", "Truck", "SUV", "Van"],
      },
    ],
    serviceRadius: {
      type: Number,
      required: [true, "Please add service radius in km"],
    },
    pricing: {
      baseFee: Number,
      perKmRate: Number,
      emergencyRate: Number,
    },
    availability: {
      type: String,
      enum: ["24/7", "Business Hours", "On Call"],
      default: "Business Hours",
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Towing", towingSchema)

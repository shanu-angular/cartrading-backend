const mongoose = require("mongoose")

const carViewSchema = new mongoose.Schema(
  {
    car: {
      type: mongoose.Schema.ObjectId,
      ref: "Car",
      required: true,
    },
    viewer: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: String,
    viewType: {
      type: String,
      enum: ["popup", "details", "list"],
      default: "list",
    },
  },
  {
    timestamps: true,
  },
)

// Prevent duplicate views from same IP within 24 hours
carViewSchema.index({ car: 1, ipAddress: 1, createdAt: 1 })

module.exports = mongoose.model("CarView", carViewSchema)

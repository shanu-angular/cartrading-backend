const mongoose = require("mongoose")

const bidSchema = new mongoose.Schema(
  {
    car: {
      type: mongoose.Schema.ObjectId,
      ref: "Car",
      required: true,
    },
    bidder: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    carOwner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Please add bid amount"],
      min: [1, "Bid amount must be positive"],
    },
    message: {
      type: String,
      maxlength: [500, "Message cannot be more than 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    response: {
      message: String,
      respondedAt: Date,
    },
    isCounterOffer: {
      type: Boolean,
      default: false,
    },
    originalBid: {
      type: mongoose.Schema.ObjectId,
      ref: "Bid",
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
bidSchema.index({ car: 1, bidder: 1 })
bidSchema.index({ carOwner: 1, status: 1 })
bidSchema.index({ expiresAt: 1 })

module.exports = mongoose.model("Bid", bidSchema)

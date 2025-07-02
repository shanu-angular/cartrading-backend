const mongoose = require("mongoose")

const sellerRequestSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: "Seller",
      required: true,
    },
    car: {
      type: mongoose.Schema.ObjectId,
      ref: "Car",
      required: true,
    },
    requester: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    requestType: {
      type: String,
      enum: ["general", "buy_request", "reserve_request", "bid_offer"],
      required: true,
    },
    message: {
      type: String,
      required: [true, "Please add a message"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    offerAmount: {
      type: Number,
      min: [0, "Offer amount cannot be negative"],
    },
    contactInfo: {
      phone: String,
      email: String,
      preferredTime: String,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
    },
    response: {
      message: String,
      respondedAt: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
    tags: [String],
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
sellerRequestSchema.index({ seller: 1, requestType: 1, status: 1 })
sellerRequestSchema.index({ requester: 1 })
sellerRequestSchema.index({ car: 1 })

module.exports = mongoose.model("SellerRequest", sellerRequestSchema)

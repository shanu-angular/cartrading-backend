const mongoose = require("mongoose")

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    car: {
      type: mongoose.Schema.ObjectId,
      ref: "Car",
      required: true,
    },
    carOwner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    reservationType: {
      type: String,
      enum: ["viewing", "test_drive", "inspection", "purchase_hold"],
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
    },
    location: {
      type: String,
      required: true,
    },
    contactInfo: {
      phone: String,
      email: String,
      preferredContact: {
        type: String,
        enum: ["phone", "email", "both"],
        default: "phone",
      },
    },
    specialRequests: {
      type: String,
      maxlength: [500, "Special requests cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled", "no_show"],
      default: "pending",
    },
    reservationFee: {
      amount: {
        type: Number,
        default: 0,
      },
      paid: {
        type: Boolean,
        default: false,
      },
      paymentMethod: String,
      transactionId: String,
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    response: {
      message: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
reservationSchema.index({ user: 1, status: 1 })
reservationSchema.index({ carOwner: 1, status: 1 })
reservationSchema.index({ scheduledDate: 1 })

module.exports = mongoose.model("Reservation", reservationSchema)

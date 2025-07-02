const mongoose = require("mongoose")

const offerSchema = new mongoose.Schema(
  {
    car: {
      type: mongoose.Schema.ObjectId,
      ref: "Car",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    offerAmount: {
      type: Number,
      required: [true, "Please add offer amount"],
      min: [1, "Offer amount must be positive"],
    },
    offerType: {
      type: String,
      enum: ["purchase", "exchange", "lease"],
      default: "purchase",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "financing", "bank_transfer", "check"],
      default: "cash",
    },
    downPayment: {
      type: Number,
      default: 0,
    },
    financingDetails: {
      loanAmount: Number,
      interestRate: Number,
      loanTerm: Number, // in months
      monthlyPayment: Number,
    },
    exchangeDetails: {
      exchangeCar: {
        type: mongoose.Schema.ObjectId,
        ref: "Car",
      },
      cashDifference: Number,
    },
    message: {
      type: String,
      maxlength: [1000, "Message cannot be more than 1000 characters"],
    },
    conditions: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "negotiating", "completed", "cancelled"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    negotiations: [
      {
        from: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        message: String,
        amount: Number,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    response: {
      message: String,
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
offerSchema.index({ car: 1, buyer: 1 })
offerSchema.index({ seller: 1, status: 1 })

module.exports = mongoose.model("Offer", offerSchema)

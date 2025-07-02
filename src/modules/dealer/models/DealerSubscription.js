const mongoose = require("mongoose")

const dealerSubscriptionSchema = new mongoose.Schema(
  {
    dealer: {
      type: mongoose.Schema.ObjectId,
      ref: "Dealer",
      required: true,
    },
    planType: {
      type: String,
      enum: ["basic", "premium", "enterprise"],
      required: true,
    },
    planDetails: {
      name: String,
      maxListings: Number,
      maxLots: Number,
      featuredListings: Number,
      prioritySupport: Boolean,
      analyticsAccess: Boolean,
      customBranding: Boolean,
    },
    pricing: {
      monthlyPrice: Number,
      yearlyPrice: Number,
      setupFee: Number,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "suspended"],
      default: "active",
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "bank_transfer", "paypal"],
    },
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    usage: {
      currentListings: {
        type: Number,
        default: 0,
      },
      currentLots: {
        type: Number,
        default: 0,
      },
      featuredListingsUsed: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
dealerSubscriptionSchema.index({ dealer: 1 })
dealerSubscriptionSchema.index({ endDate: 1 })

module.exports = mongoose.model("DealerSubscription", dealerSubscriptionSchema)

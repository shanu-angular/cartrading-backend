const mongoose = require("mongoose")

const sellerPaymentFormSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: "Seller",
      required: true,
    },
    formName: {
      type: String,
      required: [true, "Please add payment form name"],
      trim: true,
    },
    paymentType: {
      type: String,
      enum: ["credit_card", "debit_card", "bank_account", "paypal", "other"],
      required: true,
    },
    cardDetails: {
      cardNumber: {
        type: String,
        select: false, // Don't return in queries for security
      },
      cardHolderName: String,
      expiryMonth: String,
      expiryYear: String,
      cvv: {
        type: String,
        select: false, // Don't return in queries for security
      },
      cardType: {
        type: String,
        enum: ["visa", "mastercard", "amex", "discover", "other"],
      },
    },
    bankDetails: {
      accountNumber: {
        type: String,
        select: false, // Don't return in queries for security
      },
      routingNumber: {
        type: String,
        select: false,
      },
      accountType: {
        type: String,
        enum: ["checking", "savings"],
      },
      bankName: String,
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: "USA",
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: Date,
    // Masked display information (safe to return)
    displayInfo: {
      maskedNumber: String, // e.g., "**** **** **** 1234"
      displayName: String, // e.g., "My Chase Visa card"
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
sellerPaymentFormSchema.index({ seller: 1, isActive: 1 })

module.exports = mongoose.model("SellerPaymentForm", sellerPaymentFormSchema)

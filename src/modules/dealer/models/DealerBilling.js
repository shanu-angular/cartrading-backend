const mongoose = require("mongoose")

const dealerBillingSchema = new mongoose.Schema(
  {
    dealer: {
      type: mongoose.Schema.ObjectId,
      ref: "Dealer",
      required: true,
    },
    car: {
      type: mongoose.Schema.ObjectId,
      ref: "Car",
      required: true,
    },
    lot: {
      type: mongoose.Schema.ObjectId,
      ref: "DealerLot",
    },
    billingType: {
      type: String,
      enum: ["listing_fee", "premium_listing", "featured_listing", "subscription", "commission", "other"],
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Please add billing amount"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "bank_transfer", "paypal", "stripe", "cash"],
    },
    paymentDetails: {
      transactionId: String,
      paymentDate: Date,
      paymentReference: String,
      paymentGateway: String,
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    billingPeriod: {
      startDate: Date,
      endDate: Date,
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
)

// Generate invoice number before saving
dealerBillingSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments()
    this.invoiceNumber = `INV-${Date.now()}-${count + 1}`
  }
  next()
})

// Index for efficient queries
dealerBillingSchema.index({ dealer: 1, status: 1 })
dealerBillingSchema.index({ dueDate: 1 })
dealerBillingSchema.index({ invoiceNumber: 1 })

module.exports = mongoose.model("DealerBilling", dealerBillingSchema)

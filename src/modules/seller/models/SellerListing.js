const mongoose = require("mongoose")

const sellerListingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    listingPlan: {
      type: String,
      enum: ["free", "standard", "enhanced", "deluxe"],
      required: true,
    },
    planDetails: {
      duration: Number,
      photoLimit: Number,
      videoAllowed: Boolean,
      price: Number,
    },
    premiumFeatures: {
      thickBorders: { type: Boolean, default: false },
      topOfList: { type: Boolean, default: false },
      showOnTop: { type: Boolean, default: false },
      colorBackground: { type: Boolean, default: false },
      auctionEnabled: { type: Boolean, default: false },
    },
    pricing: {
      basePlan: Number,
      premiumFeatureCost: Number,
      subtotal: Number,
      tax: Number,
      totalCost: Number,
      currency: { type: String, default: "SAR" },
    },
    listingStatus: {
      type: String,
      enum: ["draft", "active", "expired", "sold", "cancelled"],
      default: "draft",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentDetails: {
      transactionId: String,
      paymentMethod: String,
      paymentDate: Date,
      amount: Number,
    },
    billingInfo: {
      name: String,
      address: String,
      phone: String,
      email: String,
    },
    expiryDate: Date,
    views: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("SellerListing", sellerListingSchema)

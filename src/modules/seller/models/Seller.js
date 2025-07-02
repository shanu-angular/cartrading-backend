const mongoose = require("mongoose")

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    businessAddress: {
      type: String,
      required: [true, "Business address is required"],
    },
    businessPhone: {
      type: String,
      required: [true, "Business phone is required"],
    },
    businessEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    businessLicense: {
      type: String,
      default: "",
    },
    taxId: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    socialMedia: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    businessHours: {
      monday: { type: String, default: "9:00 AM - 6:00 PM" },
      tuesday: { type: String, default: "9:00 AM - 6:00 PM" },
      wednesday: { type: String, default: "9:00 AM - 6:00 PM" },
      thursday: { type: String, default: "9:00 AM - 6:00 PM" },
      friday: { type: String, default: "9:00 AM - 6:00 PM" },
      saturday: { type: String, default: "9:00 AM - 4:00 PM" },
      sunday: { type: String, default: "Closed" },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["basic", "premium", "enterprise"],
      default: "basic",
    },
    subscriptionExpiry: {
      type: Date,
    },
    totalListings: {
      type: Number,
      default: 0,
    },
    activeListings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Index for search
sellerSchema.index({ businessName: "text", description: "text" })

module.exports = mongoose.model("Seller", sellerSchema)

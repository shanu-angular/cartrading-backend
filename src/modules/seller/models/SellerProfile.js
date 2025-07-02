const mongoose = require("mongoose")

const sellerProfileSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: "Seller",
      required: true,
    },
    personalInfo: {
      firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
      },
      phone: {
        type: String,
        required: [true, "Phone is required"],
      },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
          type: String,
          default: "USA",
        },
      },
    },
    businessInfo: {
      businessName: String,
      businessAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
          type: String,
          default: "USA",
        },
      },
      businessPhone: String,
      businessEmail: String,
      licenseNumber: String,
      taxId: String,
    },
    locationInfo: {
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      mapDisplayName: String,
      isLocationPublic: {
        type: Boolean,
        default: true,
      },
    },
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
      privacy: {
        showPhone: {
          type: Boolean,
          default: true,
        },
        showEmail: {
          type: Boolean,
          default: true,
        },
        showAddress: {
          type: Boolean,
          default: false,
        },
      },
    },
    avatar: {
      type: String,
      default: "default-avatar.png",
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
sellerProfileSchema.index({ seller: 1 })

module.exports = mongoose.model("SellerProfile", sellerProfileSchema)

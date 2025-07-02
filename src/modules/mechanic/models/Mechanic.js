const mongoose = require("mongoose")

const mechanicSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    shopName: {
      type: String,
      required: [true, "Please add shop name"],
      trim: true,
    },
    shopAddress: {
      type: String,
      required: [true, "Please add shop address"],
    },
    shopPhone: {
      type: String,
      required: [true, "Please add shop phone"],
    },
    licenseNumber: {
      type: String,
      required: [true, "Please add license number"],
      unique: true,
    },
    specializations: [
      {
        type: String,
        enum: [
          "Engine Repair",
          "Brake Service",
          "Transmission",
          "AC Repair",
          "Electrical",
          "Body Work",
          "Oil Change",
          "Tire Service",
        ],
      },
    ],
    experience: {
      type: Number,
      required: [true, "Please add years of experience"],
    },
    services: [
      {
        name: String,
        price: Number,
        description: String,
      },
    ],
    workingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Mechanic", mechanicSchema)

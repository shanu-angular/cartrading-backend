const mongoose = require("mongoose")

const carSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Car title is required"],
      trim: true,
    },
    make: {
      type: String,
      required: [true, "Car make is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Car model is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Car year is required"],
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    price: {
      type: Number,
      required: [true, "Car price is required"],
      min: 0,
    },
    mileage: {
      type: Number,
      required: [true, "Car mileage is required"],
      min: 0,
    },
    fuelType: {
      type: String,
      required: [true, "Fuel type is required"],
      enum: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "LPG"],
    },
    transmission: {
      type: String,
      required: [true, "Transmission type is required"],
      enum: ["Manual", "Automatic", "CVT"],
    },
    bodyType: {
      type: String,
      required: [true, "Body type is required"],
      enum: ["Sedan", "SUV", "Hatchback", "Coupe", "Convertible", "Wagon", "Truck", "Van"],
    },
    color: {
      type: String,
      required: [true, "Car color is required"],
    },
    condition: {
      type: String,
      required: [true, "Car condition is required"],
      enum: ["New", "Used", "Certified Pre-Owned"],
    },
    description: {
      type: String,
      required: [true, "Car description is required"],
    },
    features: [
      {
        type: String,
      },
    ],
    images: [
      {
        type: String,
      },
    ],
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerType: {
      type: String,
      enum: ["user", "seller", "dealer"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["available", "sold", "reserved", "pending"],
      default: "available",
    },
  },
  {
    timestamps: true,
  },
)

// Index for search
carSchema.index({ title: "text", make: "text", model: "text", description: "text" })
carSchema.index({ make: 1, model: 1, year: 1 })
carSchema.index({ price: 1 })
carSchema.index({ city: 1 })

module.exports = mongoose.model("Car", carSchema)

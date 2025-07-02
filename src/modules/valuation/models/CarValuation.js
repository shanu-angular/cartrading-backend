const mongoose = require("mongoose")

const carValuationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    carDetails: {
      make: {
        type: String,
        required: true,
      },
      model: {
        type: String,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      },
      mileage: {
        type: Number,
        required: true,
      },
      condition: {
        type: String,
        enum: ["Excellent", "Good", "Fair", "Poor"],
        required: true,
      },
      color: {
        type: String,
        required: true,
      },
      location: {
        type: String,
        required: true,
      },
      hadAccident: {
        type: Boolean,
        default: false,
      },
      isRentalCar: {
        type: Boolean,
        default: false,
      },
      previousOwners: {
        type: Number,
        default: 1,
      },
      bodyType: String,
      fuelType: String,
      transmission: String,
      engineSize: String,
    },
    valuation: {
      estimatedValue: {
        type: Number,
        required: true,
      },
      priceRange: {
        min: Number,
        max: Number,
      },
      marketTrend: {
        type: String,
        enum: ["increasing", "stable", "decreasing"],
        default: "stable",
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 85,
      },
      factors: [
        {
          factor: String,
          impact: {
            type: String,
            enum: ["positive", "negative", "neutral"],
          },
          description: String,
        },
      ],
    },
    aiModel: {
      version: {
        type: String,
        default: "v1.0",
      },
      algorithm: {
        type: String,
        default: "regression_ensemble",
      },
      dataPoints: {
        type: Number,
        default: 0,
      },
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

// Index for efficient queries
carValuationSchema.index({ user: 1 })
carValuationSchema.index({ "carDetails.make": 1, "carDetails.model": 1, "carDetails.year": 1 })

module.exports = mongoose.model("CarValuation", carValuationSchema)

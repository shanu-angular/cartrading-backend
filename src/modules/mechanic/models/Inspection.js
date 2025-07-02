const mongoose = require("mongoose")

const inspectionSchema = new mongoose.Schema(
  {
    mechanic: {
      type: mongoose.Schema.ObjectId,
      ref: "Mechanic",
      required: true,
    },
    car: {
      type: mongoose.Schema.ObjectId,
      ref: "Car",
      required: true,
    },
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    inspectionType: {
      type: String,
      enum: ["basic", "comprehensive", "pre_purchase", "warranty", "custom"],
      required: true,
    },
    inspectionLevel: {
      type: String,
      enum: ["Level 1", "Level 2", "Level 3", "Level 4"],
      required: true,
    },
    inspectionPoints: {
      type: Number,
      required: true,
    },
    cost: {
      type: Number,
      required: [true, "Please add inspection cost"],
      min: [0, "Cost cannot be negative"],
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "in_progress", "completed", "cancelled", "rejected"],
      default: "requested",
    },
    scheduledDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    externalInspection: {
      condition: {
        type: String,
        enum: ["Excellent", "Good", "Fair", "Poor"],
      },
      dateOfService: Date,
      minorScratches: {
        type: String,
        enum: ["None", "Minor", "Moderate", "Severe"],
      },
      wornOut: {
        type: String,
        enum: ["0%", "25%", "50%", "75%", "100%"],
      },
      majorDamages: {
        type: String,
        maxlength: [500, "Description cannot exceed 500 characters"],
      },
    },
    internalInspection: {
      condition: {
        type: String,
        enum: ["Excellent", "Good", "Fair", "Poor"],
      },
      dateOfService: Date,
      minorScratches: {
        type: String,
        enum: ["None", "Minor", "Moderate", "Severe"],
      },
      wornOut: {
        type: String,
        enum: ["0%", "25%", "50%", "75%", "100%"],
      },
      majorDamages: {
        type: String,
        maxlength: [500, "Description cannot exceed 500 characters"],
      },
    },
    engineInspection: {
      condition: {
        type: String,
        enum: ["Excellent", "Good", "Fair", "Poor"],
      },
      dateOfService: Date,
      minorScratches: {
        type: String,
        enum: ["None", "Minor", "Moderate", "Severe"],
      },
      wornOut: {
        type: String,
        enum: ["0%", "25%", "50%", "75%", "100%"],
      },
      majorDamages: {
        type: String,
        maxlength: [500, "Description cannot exceed 500 characters"],
      },
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 10,
    },
    recommendations: [
      {
        category: String,
        description: String,
        priority: {
          type: String,
          enum: ["Low", "Medium", "High", "Critical"],
        },
        estimatedCost: Number,
      },
    ],
    images: [
      {
        category: {
          type: String,
          enum: ["external", "internal", "engine", "damage", "other"],
        },
        url: String,
        description: String,
      },
    ],
    inspectionReport: {
      summary: String,
      detailedFindings: String,
      safetyIssues: [String],
      maintenanceRequired: [String],
    },
    customerNotes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    mechanicNotes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
inspectionSchema.index({ mechanic: 1, status: 1 })
inspectionSchema.index({ customer: 1 })
inspectionSchema.index({ car: 1 })

module.exports = mongoose.model("Inspection", inspectionSchema)

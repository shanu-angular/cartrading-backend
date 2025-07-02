const mongoose = require("mongoose")

const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: "UAE", // Default to UAE, can be changed
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

// Index for search functionality
stateSchema.index({ name: 1 })
stateSchema.index({ code: 1 })
stateSchema.index({ country: 1 })

module.exports = mongoose.model("State", stateSchema)

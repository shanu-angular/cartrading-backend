const mongoose = require("mongoose")

const carMakerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
carMakerSchema.index({ name: 1 })
carMakerSchema.index({ isActive: 1 })

module.exports = mongoose.model("CarMaker", carMakerSchema)

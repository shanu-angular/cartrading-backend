const mongoose = require("mongoose")

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // enforce unique city names globally
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

citySchema.index({ name: 1 }, { unique: true })
citySchema.index({ isActive: 1 })

module.exports = mongoose.model("City", citySchema)

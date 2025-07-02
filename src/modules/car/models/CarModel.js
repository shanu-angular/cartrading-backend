const mongoose = require("mongoose")

const carModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    maker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarMaker",
      required: true,
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

// Compound index for maker and name
carModelSchema.index({ maker: 1, name: 1 }, { unique: true })
carModelSchema.index({ maker: 1 })
carModelSchema.index({ isActive: 1 })

module.exports = mongoose.model("CarModel", carModelSchema)

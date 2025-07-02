const mongoose = require("mongoose")

const dealerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    dealershipName: {
      type: String,
      required: [true, "Please add dealership name"],
      trim: true,
    },
    dealershipAddress: {
      type: String,
      required: [true, "Please add dealership address"],
    },
    dealershipPhone: {
      type: String,
      required: [true, "Please add dealership phone"],
    },
    licenseNumber: {
      type: String,
      required: [true, "Please add license number"],
      unique: true,
    },
    brands: [
      {
        type: String,
      },
    ],
    services: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      maxlength: [500, "Description cannot be more than 500 characters"],
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





module.exports = mongoose.model("Dealer", dealerSchema)

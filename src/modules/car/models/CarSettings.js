const mongoose = require("mongoose");

const carSettingsSchema = new mongoose.Schema(
  {
    minPrice: {
      type: Number,
      default: 1000,
      min: 0,
    },
    maxPrice: {
      type: Number,
      default: 10000000,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CarSettings", carSettingsSchema);

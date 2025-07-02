const mongoose = require("mongoose")

const inquirySchema = new mongoose.Schema(
  {
    car: {
      type: mongoose.Schema.ObjectId,
      ref: "Car",
      required: true,
    },
    inquirer: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    carOwner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: [true, "Please add a message"],
      maxlength: [1000, "Message cannot be more than 1000 characters"],
    },
    inquiryType: {
      type: String,
      enum: ["general", "price", "inspection", "test_drive", "purchase"],
      default: "general",
    },
    status: {
      type: String,
      enum: ["pending", "responded", "closed"],
      default: "pending",
    },
    response: {
      message: String,
      respondedAt: Date,
    },
    contactInfo: {
      phone: String,
      email: String,
      preferredTime: String,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Inquiry", inquirySchema)

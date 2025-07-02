const mongoose = require("mongoose")

const towingBillingSchema = new mongoose.Schema(
  {
    towingService: {
      type: mongoose.Schema.ObjectId,
      ref: "Towing",
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
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    brand: {
      type: String,
      required: true,
    },
    carId: {
      type: String,
      required: true,
    },
    towingAmount: {
      type: Number,
      required: true,
    },
    serviceType: {
      type: String,
      enum: [
        "Emergency Towing",
        "Roadside Assistance",
        "Jump Start",
        "Tire Change",
        "Lockout Service",
        "Fuel Delivery",
      ],
      required: true,
    },
    serviceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Received", "Overdue", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit Card", "Bank Transfer", "Check"],
    },
    paymentDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    distance: {
      type: Number, // in kilometers
    },
    baseFee: {
      type: Number,
    },
    perKmRate: {
      type: Number,
    },
    emergencyRate: {
      type: Number,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Generate invoice number before saving
towingBillingSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments()
    this.invoiceNumber = `TOW-${String(count + 1).padStart(6, "0")}`
  }
  next()
})

module.exports = mongoose.model("TowingBilling", towingBillingSchema)

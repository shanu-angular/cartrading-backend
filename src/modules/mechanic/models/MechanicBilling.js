const mongoose = require("mongoose")

const mechanicBillingSchema = new mongoose.Schema(
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
    inspection: {
      type: mongoose.Schema.ObjectId,
      ref: "Inspection",
    },
    serviceType: {
      type: String,
      enum: ["inspection", "repair", "maintenance", "diagnostic", "consultation"],
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Please add service amount"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "received", "overdue", "cancelled", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit_card", "bank_transfer", "paypal", "stripe"],
    },
    paymentDetails: {
      transactionId: String,
      paymentDate: Date,
      paymentReference: String,
      paymentGateway: String,
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    serviceDescription: {
      type: String,
      required: [true, "Please add service description"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    laborHours: {
      type: Number,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    partsUsed: [
      {
        partName: String,
        partNumber: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
      },
    ],
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
)

// Generate invoice number before saving
mechanicBillingSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments()
    this.invoiceNumber = `MECH-${Date.now()}-${count + 1}`
  }
  next()
})

// Index for efficient queries
mechanicBillingSchema.index({ mechanic: 1, status: 1 })
mechanicBillingSchema.index({ customer: 1 })
mechanicBillingSchema.index({ dueDate: 1 })

module.exports = mongoose.model("MechanicBilling", mechanicBillingSchema)

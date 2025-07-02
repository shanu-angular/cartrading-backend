const mongoose = require("mongoose")

const transportRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleInfo: {
      make: { type: String, required: true },
      model: { type: String, required: true },
      year: { type: Number, required: true },
      color: { type: String },
      vin: { type: String },
      condition: {
        type: String,
        enum: ["Running", "Not Running", "Damaged"],
        default: "Running",
      },
    },
    pickupLocation: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    destinationLocation: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    customerPhone: {
      type: String,
      required: true,
    },
    preferredPickupDate: {
      type: Date,
      required: true,
    },
    preferredDeliveryDate: {
      type: Date,
    },
    transportType: {
      type: String,
      enum: ["Open Transport", "Enclosed Transport", "Expedited"],
      default: "Open Transport",
    },
    distance: {
      type: Number, // in miles/kilometers
    },
    estimatedCost: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Pending", "Quote Sent", "Accepted", "In Transit", "Delivered", "Cancelled"],
      default: "Pending",
    },
    assignedTowing: {
      type: mongoose.Schema.ObjectId,
      ref: "Towing",
    },
    quotes: [
      {
        towingService: {
          type: mongoose.Schema.ObjectId,
          ref: "Towing",
        },
        amount: Number,
        message: String,
        validUntil: Date,
        status: {
          type: String,
          enum: ["Pending", "Accepted", "Rejected", "Expired"],
          default: "Pending",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    specialInstructions: {
      type: String,
    },
    images: [
      {
        url: String,
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("TransportRequest", transportRequestSchema)

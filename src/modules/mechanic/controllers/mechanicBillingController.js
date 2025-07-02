const MechanicBilling = require("../models/MechanicBilling")
const Mechanic = require("../models/Mechanic")
const Car = require("../../car/models/Car")
const { validationResult } = require("express-validator")

// @desc    Get mechanic billing records
// @route   GET /api/mechanics/billing
// @access  Private (Mechanic only)
const getMechanicBilling = async (req, res) => {
  try {
    const mechanicId = req.user._id
    const { status, page = 1, limit = 10, startDate, endDate } = req.query

    const mechanic = await Mechanic.findOne({ user: mechanicId })
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic profile not found",
      })
    }

    // Build query
    const query = { mechanic: mechanic._id }

    if (status) query.status = status

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const billingRecords = await MechanicBilling.find(query)
      .populate("car", "title images make model year")
      .populate("customer", "name phone email")
      .populate("inspection", "inspectionType status")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await MechanicBilling.countDocuments(query)

    // Calculate summary
    const summary = await MechanicBilling.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ])

    res.json({
      success: true,
      data: billingRecords,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      summary,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Create billing record
// @route   POST /api/mechanics/billing
// @access  Private (Mechanic only)
const createBillingRecord = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const mechanicId = req.user._id

    const mechanic = await Mechanic.findOne({ user: mechanicId })
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic profile not found",
      })
    }

    const {
      carId,
      customerId,
      inspectionId,
      serviceType,
      brand,
      amount,
      dueDate,
      serviceDescription,
      laborHours,
      hourlyRate,
      partsUsed,
      taxAmount,
      discountAmount,
    } = req.body

    // Calculate total amount
    const totalAmount = amount + (taxAmount || 0) - (discountAmount || 0)

    const billing = await MechanicBilling.create({
      mechanic: mechanic._id,
      car: carId,
      customer: customerId,
      inspection: inspectionId,
      serviceType,
      brand,
      amount,
      dueDate,
      serviceDescription,
      laborHours,
      hourlyRate,
      partsUsed,
      taxAmount,
      discountAmount,
      totalAmount,
    })

    const populatedBilling = await MechanicBilling.findById(billing._id)
      .populate("car", "title images")
      .populate("customer", "name phone email")

    res.status(201).json({
      success: true,
      data: populatedBilling,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update billing record
// @route   PUT /api/mechanics/billing/:id
// @access  Private (Mechanic only)
const updateBillingRecord = async (req, res) => {
  try {
    const mechanicId = req.user._id

    const mechanic = await Mechanic.findOne({ user: mechanicId })
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic profile not found",
      })
    }

    let billing = await MechanicBilling.findById(req.params.id)
    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      })
    }

    // Check ownership
    if (billing.mechanic.toString() !== mechanic._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this billing record",
      })
    }

    billing = await MechanicBilling.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("car", "title images")

    res.json({
      success: true,
      data: billing,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Mark billing as received
// @route   PUT /api/mechanics/billing/:id/receive
// @access  Private (Mechanic only)
const markBillingAsReceived = async (req, res) => {
  try {
    const mechanicId = req.user._id
    const { paymentMethod, transactionId, paymentReference } = req.body

    const mechanic = await Mechanic.findOne({ user: mechanicId })
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic profile not found",
      })
    }

    const billing = await MechanicBilling.findById(req.params.id)
    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      })
    }

    // Check ownership
    if (billing.mechanic.toString() !== mechanic._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this billing record",
      })
    }

    if (billing.status === "received") {
      return res.status(400).json({
        success: false,
        message: "Payment already received",
      })
    }

    billing.status = "received"
    billing.paymentMethod = paymentMethod
    billing.paymentDetails = {
      transactionId,
      paymentDate: new Date(),
      paymentReference,
      paymentGateway: "manual",
    }

    await billing.save()

    res.json({
      success: true,
      data: billing,
      message: "Payment marked as received",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get billing summary
// @route   GET /api/mechanics/billing/summary
// @access  Private (Mechanic only)
const getBillingSummary = async (req, res) => {
  try {
    const mechanicId = req.user._id

    const mechanic = await Mechanic.findOne({ user: mechanicId })
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic profile not found",
      })
    }

    const summary = await MechanicBilling.aggregate([
      { $match: { mechanic: mechanic._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ])

    // Get overdue bills
    const overdueBills = await MechanicBilling.countDocuments({
      mechanic: mechanic._id,
      status: "pending",
      dueDate: { $lt: new Date() },
    })

    res.json({
      success: true,
      data: {
        summary,
        overdueBills,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

module.exports = {
  getMechanicBilling,
  createBillingRecord,
  updateBillingRecord,
  markBillingAsReceived,
  getBillingSummary,
}

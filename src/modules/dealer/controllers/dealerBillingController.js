const DealerBilling = require("../models/DealerBilling")
const Dealer = require("../models/Dealer")
const Car = require("../../car/models/Car")
const { validationResult } = require("express-validator")

// @desc    Get dealer billing records
// @route   GET /api/dealers/billing
// @access  Private (Dealer only)
const getDealerBilling = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    const { status, page = 1, limit = 10, startDate, endDate } = req.query

    // Build query
    const query = { dealer: dealer._id }

    if (status) query.status = status

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const billingRecords = await DealerBilling.find(query)
      .populate("car", "title images make model year")
      .populate("lot", "lotName")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await DealerBilling.countDocuments(query)

    // Calculate summary
    const summary = await DealerBilling.aggregate([
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
    console.error("Get dealer billing error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Create billing record
// @route   POST /api/dealers/billing
// @access  Private (Admin/System)
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

    const {
      dealerId,
      carId,
      lotId,
      billingType,
      brand,
      amount,
      dueDate,
      description,
      taxAmount,
      discountAmount,
      billingPeriod,
    } = req.body

    // Calculate total amount
    const totalAmount = amount + (taxAmount || 0) - (discountAmount || 0)

    const billing = new DealerBilling({
      dealer: dealerId,
      car: carId,
      lot: lotId,
      billingType,
      brand,
      amount,
      dueDate,
      description,
      taxAmount,
      discountAmount,
      totalAmount,
      billingPeriod,
    })

    await billing.save()

    const populatedBilling = await DealerBilling.findById(billing._id)
      .populate("car", "title images")
      .populate("dealer", "dealershipName")

    res.status(201).json({
      success: true,
      message: "Billing record created successfully",
      data: populatedBilling,
    })
  } catch (error) {
    console.error("Create billing record error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update billing record
// @route   PUT /api/dealers/billing/:id
// @access  Private (Dealer only)
const updateBillingRecord = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    let billing = await DealerBilling.findById(req.params.id)
    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      })
    }

    // Check ownership
    if (billing.dealer.toString() !== dealer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this billing record",
      })
    }

    // Only allow certain fields to be updated by dealer
    const allowedUpdates = ["paymentMethod", "notes"]
    const updates = {}
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    billing = await DealerBilling.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("car", "title images")

    res.json({
      success: true,
      message: "Billing record updated successfully",
      data: billing,
    })
  } catch (error) {
    console.error("Update billing record error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Mark billing as paid
// @route   PUT /api/dealers/billing/:id/pay
// @access  Private (Dealer only)
const markBillingAsPaid = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    const { paymentMethod, transactionId, paymentReference } = req.body

    const billing = await DealerBilling.findById(req.params.id)
    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      })
    }

    // Check ownership
    if (billing.dealer.toString() !== dealer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this billing record",
      })
    }

    if (billing.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Billing record is already paid",
      })
    }

    billing.status = "paid"
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
      message: "Payment recorded successfully",
      data: billing,
    })
  } catch (error) {
    console.error("Mark billing as paid error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get billing summary
// @route   GET /api/dealers/billing/summary
// @access  Private (Dealer only)
const getBillingSummary = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    const summary = await DealerBilling.aggregate([
      { $match: { dealer: dealer._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ])

    // Get overdue bills
    const overdueBills = await DealerBilling.countDocuments({
      dealer: dealer._id,
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
    console.error("Get billing summary error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

module.exports = {
  getDealerBilling,
  createBillingRecord,
  updateBillingRecord,
  markBillingAsPaid,
  getBillingSummary,
}

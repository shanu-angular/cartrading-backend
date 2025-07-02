const TowingBilling = require("../models/TowingBilling")

// Get billing records
const getBillingRecords = async (req, res) => {
  try {
    const billing = await TowingBilling.find({ towingService: req.user.towingId }).sort({ createdAt: -1 })
    res.json(billing)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get single billing record
const getBillingRecord = async (req, res) => {
  try {
    const billing = await TowingBilling.findById(req.params.id)
    if (!billing) {
      return res.status(404).json({ message: "Billing record not found" })
    }
    res.json(billing)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Create billing record
const createBillingRecord = async (req, res) => {
  try {
    const billing = new TowingBilling({
      ...req.body,
      towingService: req.user.towingId,
    })
    await billing.save()
    res.status(201).json({ message: "Billing record created", billing })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update billing record
const updateBillingRecord = async (req, res) => {
  try {
    const billing = await TowingBilling.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!billing) {
      return res.status(404).json({ message: "Billing record not found" })
    }
    res.json({ message: "Billing record updated", billing })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Delete billing record
const deleteBillingRecord = async (req, res) => {
  try {
    const billing = await TowingBilling.findByIdAndDelete(req.params.id)
    if (!billing) {
      return res.status(404).json({ message: "Billing record not found" })
    }
    res.json({ message: "Billing record deleted" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get billing stats
const getBillingStats = async (req, res) => {
  try {
    const stats = {
      totalRevenue: 0,
      pendingPayments: 0,
      completedJobs: 0,
    }
    res.json(stats)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  getBillingRecords,
  getBillingRecord,
  createBillingRecord,
  updateBillingRecord,
  deleteBillingRecord,
  getBillingStats,
}

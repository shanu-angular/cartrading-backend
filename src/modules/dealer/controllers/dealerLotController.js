const DealerLot = require("../models/DealerLot")
const Dealer = require("../models/Dealer")
const User = require("../../user/models/User")
const { validationResult } = require("express-validator")

// @desc    Get all dealer lots
// @route   GET /api/dealers/lots
// @access  Private (Dealer only)
const getDealerLots = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    const lots = await DealerLot.find({ dealer: dealer._id, isActive: true })
      .populate("assignedManager", "name email phone")
      .sort("-createdAt")

    res.json({
      success: true,
      data: lots,
    })
  } catch (error) {
    console.error("Get dealer lots error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Create new dealer lot
// @route   POST /api/dealers/lots
// @access  Private (Dealer only)
const createDealerLot = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    const {
      lotName,
      image,
      brandsOffered,
      subscriptionPlan,
      assignedManager,
      showroomLocations,
      capacity,
      operatingHours,
      amenities,
    } = req.body

    // Verify assigned manager exists if provided
    if (assignedManager) {
      const manager = await User.findById(assignedManager)
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Assigned manager not found",
        })
      }
    }

    const lot = new DealerLot({
      dealer: dealer._id,
      lotName,
      image,
      brandsOffered,
      subscriptionPlan,
      assignedManager,
      showroomLocations,
      capacity,
      operatingHours,
      amenities,
    })

    await lot.save()

    const populatedLot = await DealerLot.findById(lot._id).populate("assignedManager", "name email phone")

    res.status(201).json({
      success: true,
      message: "Dealer lot created successfully",
      data: populatedLot,
    })
  } catch (error) {
    console.error("Create dealer lot error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get single dealer lot
// @route   GET /api/dealers/lots/:id
// @access  Private (Dealer only)
const getDealerLot = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    const lot = await DealerLot.findById(req.params.id).populate("assignedManager", "name email phone")

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Lot not found",
      })
    }

    // Check ownership
    if (lot.dealer.toString() !== dealer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this lot",
      })
    }

    res.json({
      success: true,
      data: lot,
    })
  } catch (error) {
    console.error("Get dealer lot error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update dealer lot
// @route   PUT /api/dealers/lots/:id
// @access  Private (Dealer only)
const updateDealerLot = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    let lot = await DealerLot.findById(req.params.id)
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Lot not found",
      })
    }

    // Check ownership
    if (lot.dealer.toString() !== dealer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this lot",
      })
    }

    lot = await DealerLot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedManager", "name email phone")

    res.json({
      success: true,
      message: "Lot updated successfully",
      data: lot,
    })
  } catch (error) {
    console.error("Update dealer lot error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Delete dealer lot
// @route   DELETE /api/dealers/lots/:id
// @access  Private (Dealer only)
const deleteDealerLot = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id })
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    const lot = await DealerLot.findById(req.params.id)
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Lot not found",
      })
    }

    // Check ownership
    if (lot.dealer.toString() !== dealer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this lot",
      })
    }

    // Soft delete
    lot.isActive = false
    await lot.save()

    res.json({
      success: true,
      message: "Lot deleted successfully",
    })
  } catch (error) {
    console.error("Delete dealer lot error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

module.exports = {
  getDealerLots,
  createDealerLot,
  getDealerLot,
  updateDealerLot,
  deleteDealerLot,
}

const Inspection = require("../models/Inspection")

// Get inspection requests
const getInspectionRequests = async (req, res) => {
  try {
    const inspections = await Inspection.find({ status: "pending" })
      .populate("car", "make model year")
      .populate("requestedBy", "name email")
    res.json(inspections)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Accept inspection request
const acceptInspectionRequest = async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      {
        mechanic: req.user.mechanicId,
        status: "accepted",
        acceptedAt: new Date(),
      },
      { new: true },
    )

    if (!inspection) {
      return res.status(404).json({ message: "Inspection not found" })
    }

    res.json({ message: "Inspection request accepted", inspection })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Start inspection
const startInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      {
        status: "in_progress",
        startedAt: new Date(),
      },
      { new: true },
    )

    if (!inspection) {
      return res.status(404).json({ message: "Inspection not found" })
    }

    res.json({ message: "Inspection started", inspection })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Fill inspection results
const fillInspectionResults = async (req, res) => {
  try {
    const { externalInspection, internalInspection, engineInspection, overallRating } = req.body

    const inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      {
        externalInspection,
        internalInspection,
        engineInspection,
        overallRating,
        status: "completed",
        completedAt: new Date(),
      },
      { new: true },
    )

    if (!inspection) {
      return res.status(404).json({ message: "Inspection not found" })
    }

    res.json({ message: "Inspection completed", inspection })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get single inspection
const getInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate("car", "make model year")
      .populate("requestedBy", "name email")

    if (!inspection) {
      return res.status(404).json({ message: "Inspection not found" })
    }

    res.json(inspection)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  getInspectionRequests,
  acceptInspectionRequest,
  startInspection,
  fillInspectionResults,
  getInspection,
}

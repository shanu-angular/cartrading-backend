const TransportRequest = require("../models/TransportRequest")

// Get transport requests
const getTransportRequests = async (req, res) => {
  try {
    const requests = await TransportRequest.find({ status: "pending" })
      .populate("user", "name email")
      .populate("car", "make model year")
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get single transport request
const getTransportRequest = async (req, res) => {
  try {
    const request = await TransportRequest.findById(req.params.id)
      .populate("user", "name email")
      .populate("car", "make model year")

    if (!request) {
      return res.status(404).json({ message: "Transport request not found" })
    }

    res.json(request)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Send quote
const sendQuote = async (req, res) => {
  try {
    const { price, estimatedTime } = req.body

    const request = await TransportRequest.findByIdAndUpdate(
      req.params.id,
      {
        quote: { price, estimatedTime, towingService: req.user.towingId },
        status: "quoted",
      },
      { new: true },
    )

    if (!request) {
      return res.status(404).json({ message: "Transport request not found" })
    }

    res.json({ message: "Quote sent successfully", request })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Accept transport request
const acceptTransportRequest = async (req, res) => {
  try {
    const request = await TransportRequest.findByIdAndUpdate(
      req.params.id,
      {
        assignedTowing: req.user.towingId,
        status: "accepted",
      },
      { new: true },
    )

    if (!request) {
      return res.status(404).json({ message: "Transport request not found" })
    }

    res.json({ message: "Transport request accepted", request })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update transport status
const updateTransportStatus = async (req, res) => {
  try {
    const { status } = req.body

    const request = await TransportRequest.findByIdAndUpdate(req.params.id, { status }, { new: true })

    if (!request) {
      return res.status(404).json({ message: "Transport request not found" })
    }

    res.json({ message: "Status updated successfully", request })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get assigned requests
const getAssignedRequests = async (req, res) => {
  try {
    const requests = await TransportRequest.find({ assignedTowing: req.user.towingId })
      .populate("user", "name email")
      .populate("car", "make model year")
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  getTransportRequests,
  getTransportRequest,
  sendQuote,
  acceptTransportRequest,
  updateTransportStatus,
  getAssignedRequests,
}

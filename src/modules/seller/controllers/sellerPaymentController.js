const SellerPaymentForm = require("../models/SellerPaymentForm")
const Seller = require("../models/Seller")
const { validationResult } = require("express-validator")

// Helper function to mask card number
const maskCardNumber = (cardNumber) => {
  if (!cardNumber) return ""
  const cleaned = cardNumber.replace(/\D/g, "")
  return "**** **** **** " + cleaned.slice(-4)
}

// Helper function to mask account number
const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return ""
  const cleaned = accountNumber.replace(/\D/g, "")
  return "****" + cleaned.slice(-4)
}

// @desc    Get seller's saved payment forms
// @route   GET /api/sellers/payment-forms
// @access  Private (Seller only)
const getPaymentForms = async (req, res) => {
  try {
    const sellerId = req.user._id

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    const paymentForms = await SellerPaymentForm.find({
      seller: seller._id,
      isActive: true,
    }).sort("-createdAt")

    res.json({
      success: true,
      data: paymentForms,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Create new payment form
// @route   POST /api/sellers/payment-forms
// @access  Private (Seller only)
const createPaymentForm = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const sellerId = req.user._id

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    const { formName, paymentType, cardDetails, bankDetails, billingAddress, isDefault } = req.body

    // If this is set as default, unset other defaults
    if (isDefault) {
      await SellerPaymentForm.updateMany({ seller: seller._id }, { isDefault: false })
    }

    // Create display info based on payment type
    let displayInfo = {}
    if (paymentType === "credit_card" || paymentType === "debit_card") {
      displayInfo = {
        maskedNumber: maskCardNumber(cardDetails.cardNumber),
        displayName: formName,
      }
    } else if (paymentType === "bank_account") {
      displayInfo = {
        maskedNumber: maskAccountNumber(bankDetails.accountNumber),
        displayName: formName,
      }
    } else {
      displayInfo = {
        displayName: formName,
      }
    }

    const paymentForm = await SellerPaymentForm.create({
      seller: seller._id,
      formName,
      paymentType,
      cardDetails,
      bankDetails,
      billingAddress,
      isDefault: isDefault || false,
      displayInfo,
    })

    // Return payment form without sensitive data
    const safePaymentForm = await SellerPaymentForm.findById(paymentForm._id)

    res.status(201).json({
      success: true,
      data: safePaymentForm,
      message: "Payment form created successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update payment form
// @route   PUT /api/sellers/payment-forms/:id
// @access  Private (Seller only)
const updatePaymentForm = async (req, res) => {
  try {
    const sellerId = req.user._id

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    let paymentForm = await SellerPaymentForm.findById(req.params.id)

    if (!paymentForm) {
      return res.status(404).json({
        success: false,
        message: "Payment form not found",
      })
    }

    // Check ownership
    if (paymentForm.seller.toString() !== seller._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this payment form",
      })
    }

    const { formName, cardDetails, bankDetails, billingAddress, isDefault } = req.body

    // If this is set as default, unset other defaults
    if (isDefault) {
      await SellerPaymentForm.updateMany({ seller: seller._id, _id: { $ne: req.params.id } }, { isDefault: false })
    }

    // Update display info
    const displayInfo = paymentForm.displayInfo
    if (paymentForm.paymentType === "credit_card" || paymentForm.paymentType === "debit_card") {
      if (cardDetails && cardDetails.cardNumber) {
        displayInfo.maskedNumber = maskCardNumber(cardDetails.cardNumber)
      }
    } else if (paymentForm.paymentType === "bank_account") {
      if (bankDetails && bankDetails.accountNumber) {
        displayInfo.maskedNumber = maskAccountNumber(bankDetails.accountNumber)
      }
    }

    if (formName) {
      displayInfo.displayName = formName
    }

    paymentForm = await SellerPaymentForm.findByIdAndUpdate(
      req.params.id,
      {
        formName: formName || paymentForm.formName,
        cardDetails: cardDetails || paymentForm.cardDetails,
        bankDetails: bankDetails || paymentForm.bankDetails,
        billingAddress: billingAddress || paymentForm.billingAddress,
        isDefault: isDefault !== undefined ? isDefault : paymentForm.isDefault,
        displayInfo,
      },
      { new: true, runValidators: true },
    )

    res.json({
      success: true,
      data: paymentForm,
      message: "Payment form updated successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Delete payment form
// @route   DELETE /api/sellers/payment-forms/:id
// @access  Private (Seller only)
const deletePaymentForm = async (req, res) => {
  try {
    const sellerId = req.user._id

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    const paymentForm = await SellerPaymentForm.findById(req.params.id)

    if (!paymentForm) {
      return res.status(404).json({
        success: false,
        message: "Payment form not found",
      })
    }

    // Check ownership
    if (paymentForm.seller.toString() !== seller._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this payment form",
      })
    }

    // Soft delete
    paymentForm.isActive = false
    await paymentForm.save()

    res.json({
      success: true,
      message: "Payment form deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get single payment form
// @route   GET /api/sellers/payment-forms/:id
// @access  Private (Seller only)
const getPaymentForm = async (req, res) => {
  try {
    const sellerId = req.user._id

    const seller = await Seller.findOne({ user: sellerId })
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      })
    }

    const paymentForm = await SellerPaymentForm.findById(req.params.id)

    if (!paymentForm) {
      return res.status(404).json({
        success: false,
        message: "Payment form not found",
      })
    }

    // Check ownership
    if (paymentForm.seller.toString() !== seller._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this payment form",
      })
    }

    res.json({
      success: true,
      data: paymentForm,
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
  getPaymentForms,
  createPaymentForm,
  updatePaymentForm,
  deletePaymentForm,
  getPaymentForm,
}

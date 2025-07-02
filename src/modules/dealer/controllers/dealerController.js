const Dealer = require("../models/Dealer")
const User = require("../../user/models/User")
const { validationResult } = require("express-validator")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs");

// @desc    Register dealer
// @route   POST /api/dealers/register
// @access  Public
const registerDealer = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }

    const { name, email, password, phone, businessName, businessAddress, licenseNumber } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

  // 🔐 Hash the password manually
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Create user with hashed password
const user = new User({
  name,
  email,
  password: hashedPassword,
  phone,
  role: "dealer",
});

await user.save();


    // Create dealer profile
    const dealer = new Dealer({
      user: user._id,
      dealershipName: businessName,
      dealershipAddress: businessAddress,
      dealershipPhone: phone,
      licenseNumber,
      status: "pending",
    })

    await dealer.save()

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: "dealer" }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    })

    res.status(201).json({
      success: true,
      message: "Dealer registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      dealer: {
        id: dealer._id,
        businessName: dealer.dealershipName,
        status: dealer.status,
      },
    })
  } catch (error) {
    console.error("Dealer registration error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    })
  }
}

// @desc    Login dealer
// @route   POST /api/dealers/login
// @access  Public
const loginDealer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user || user.role !== "dealer") {
      return res.status(401).json({
        success: false,
        message: "Invalid dealer credentials",
      });
    }

    // 👇 Compare password using bcrypt directly
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid dealer credentials",
      });
    }

    // Get dealer profile
    const dealer = await Dealer.findOne({ user: user._id });
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: "dealer" }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      dealer: {
        id: dealer._id,
        businessName: dealer.dealershipName,
        status: dealer.status,
      },
    });
  } catch (error) {
    console.error("Dealer login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// @desc    Get dealer profile
// @route   GET /api/dealers/profile
// @access  Private (Dealer only)
const getDealerProfile = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ user: req.user.id }).populate("user", "name email phone city avatar")

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    res.json({
      success: true,
      data: dealer,
    })
  } catch (error) {
    console.error("Get dealer profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update dealer profile
// @route   PUT /api/dealers/profile
// @access  Private (Dealer only)
const updateDealerProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }

    const { name, phone, businessName, businessAddress, businessPhone, website, description } = req.body

    // Update user information
    await User.findByIdAndUpdate(req.user.id, {
      name,
      phone,
    })

    // Update dealer profile
    const dealer = await Dealer.findOneAndUpdate(
      { user: req.user.id },
      {
        dealershipName: businessName,
        dealershipAddress: businessAddress,
        dealershipPhone: businessPhone,
        website,
        description,
      },
      { new: true, runValidators: true },
    ).populate("user", "name email phone")

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer profile not found",
      })
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: dealer,
    })
  } catch (error) {
    console.error("Update dealer profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Create dealer profile (for existing users)
// @route   POST /api/dealers/profile/create
// @access  Private
const createDealerProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }

    // Check if dealer profile already exists
    const existingDealer = await Dealer.findOne({ user: req.user.id })
    if (existingDealer) {
      return res.status(400).json({
        success: false,
        message: "Dealer profile already exists",
      })
    }

    const { businessName, businessAddress, businessPhone, licenseNumber, website, description } = req.body

    const dealer = new Dealer({
      user: req.user.id,
      dealershipName: businessName,
      dealershipAddress: businessAddress,
      dealershipPhone: businessPhone,
      licenseNumber,
      website,
      description,
      status: "pending",
    })

    await dealer.save()

    // Update user role
    await User.findByIdAndUpdate(req.user.id, { role: "dealer" })

    const populatedDealer = await Dealer.findById(dealer._id).populate("user", "name email phone")

    res.status(201).json({
      success: true,
      message: "Dealer profile created successfully",
      data: populatedDealer,
    })
  } catch (error) {
    console.error("Create dealer profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

module.exports = {
  registerDealer,
  loginDealer,
  getDealerProfile,
  updateDealerProfile,
  createDealerProfile,
}

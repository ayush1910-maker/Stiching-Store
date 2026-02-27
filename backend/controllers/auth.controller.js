import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/nodemailer.js";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict"
};

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found while generating tokens");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    const allowedRoles = ["admin", "customer", "tailor", "delivery"];
    const normalizedRole = role ? String(role).toLowerCase() : "customer";

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    const user = await User.create({ name, email, password, role: normalizedRole });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.isActive || user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive or banned"
      });
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          accessToken,
          refreshToken
        }
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (userId) {
      await User.findByIdAndUpdate(userId, { $set: { refreshToken: null } });
    }

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({
        success: true,
        message: "Logout successful"
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded?._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    if (user.refreshToken !== incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is expired or used"
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .json({
        success: true,
        message: "Access token refreshed successfully",
        data: {
          accessToken,
          refreshToken
        }
      });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid refresh token"
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.otp = otp;
    user.otp_expired = otpExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Your OTP is <b>${otp}</b>.</p><p>It will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>`
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (!user.otp_expired || user.otp_expired.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (!user.otp_expired || user.otp_expired.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    user.password = newPassword;
    user.otp = null;
    user.otp_expired = null;
    user.refreshToken = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    user.password = newPassword;
    user.refreshToken = null;
    await user.save();

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({
        success: true,
        message: "Password changed successfully. Please login again."
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword
};

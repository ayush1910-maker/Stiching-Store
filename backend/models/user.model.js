import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true // 🔥 add this
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      sparse: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "customer", "tailor", "delivery"],
      default: "customer",
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isBanned: {
      type: Boolean,
      default: false,
      index: true
    },
    otp: {
      type: String,
      default: null
    },
    otp_expired: {
      type: Date,
      default: null
    },
    refreshToken: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// ✅ SAFE password hashing
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error); // 🔥 important
  }
});

// ✅ Password compare
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// ✅ Access Token
userSchema.methods.generateAccessToken = function () {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET not defined");
  }

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m"
    }
  );
};

// ✅ Refresh Token
userSchema.methods.generateRefreshToken = function () {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET not defined");
  }

  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d"
    }
  );
};

export const User = mongoose.model("User", userSchema);
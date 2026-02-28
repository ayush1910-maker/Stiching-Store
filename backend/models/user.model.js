import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: undefined
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ["admin", "customer", "tailor", "delivery"],
      default: "customer"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      default: null,
      select: false
    },
    otp_expired: {
      type: Date,
      default: null,
      select: false
    },
    refreshToken: {
      type: String,
      default: null,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1, isBanned: 1 });

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

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

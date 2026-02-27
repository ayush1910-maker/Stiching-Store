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
      unique: true,
      lowercase: true,
      trim: true
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
  {
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
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
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d"
    }
  );
};

export const User = mongoose.model("User", userSchema);

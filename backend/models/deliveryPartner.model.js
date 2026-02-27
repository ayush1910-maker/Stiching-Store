import mongoose, { Schema } from "mongoose";

const deliveryDocumentSchema = new Schema(
  {
    aadhar: { type: String, trim: true, default: "" },
    pan: { type: String, trim: true, default: "" },
    drivingLicense: { type: String, trim: true, default: "" },
    vehicleRegistration: { type: String, trim: true, default: "" },
    policeVerification: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const bankDetailsSchema = new Schema(
  {
    accountHolderName: { type: String, trim: true, default: "" },
    accountNumber: { type: String, trim: true, default: "" },
    ifscCode: { type: String, trim: true, uppercase: true, default: "" },
    bankName: { type: String, trim: true, default: "" },
    upiId: { type: String, trim: true, lowercase: true, default: "" }
  },
  { _id: false }
);

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 2,
        message: "currentLocation.coordinates must be [longitude, latitude]"
      }
    }
  },
  { _id: false }
);

const assignedTaskSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "StitchingOrder", required: true },
    taskType: { type: String, enum: ["pickup", "drop"], required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const deliveryPartnerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    vehicleType: {
      type: String,
      enum: ["BIKE", "SCOOTER", "BICYCLE", "CAR"],
      required: true
    },
    documents: { type: deliveryDocumentSchema, default: () => ({}) },
    isOnline: { type: Boolean, default: false },
    currentLocation: { type: geoPointSchema, default: () => ({}) },
    totalDeliveries: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    isDeleted: { type: Boolean, default: false, index: true },
    assignedTasks: { type: [assignedTaskSchema], default: [] }
  },
  { timestamps: true }
);

deliveryPartnerSchema.index({ currentLocation: "2dsphere" });

export const DeliveryPartner = mongoose.model(
  "DeliveryPartner",
  deliveryPartnerSchema
);

import mongoose, { Schema } from "mongoose";

const documentSchema = new Schema(
  {
    aadhar: { type: String, trim: true, default: "" },
    pan: { type: String, trim: true, default: "" },
    shopLicense: { type: String, trim: true, default: "" },
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

const availabilitySlotSchema = new Schema(
  {
    day: {
      type: String,
      enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      required: true
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  { _id: false }
);

const trainingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const tailorDetailSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    district: { type: String, trim: true, default: "Unknown", index: true },
    documents: { type: documentSchema, default: () => ({}) },
    portfolioImages: { type: [String], default: [] },
    serviceAreas: { type: [String], default: [] },
    servicesOffered: { type: [String], default: [] },
    availabilitySchedule: { type: [availabilitySlotSchema], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    totalOrders: { type: Number, min: 0, default: 0 },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    isApproved: { type: Boolean, default: false, index: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "banned"],
      default: "pending",
      index: true
    },
    commissionRate: { type: Number, min: 0, max: 100, default: 0 },
    rejectionCount: { type: Number, min: 0, default: 0 },
    penaltyPoints: { type: Number, min: 0, default: 0 },
    trainings: { type: [trainingSchema], default: [] },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const TailorDetail = mongoose.model("TailorDetail", tailorDetailSchema);

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

const earningsSchema = new Schema(
  {
    total: { type: Number, min: 0, default: 0 },
    paid: { type: Number, min: 0, default: 0 },
    pending: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ["PENDING", "PAID"], default: "PENDING" },
    lastPayoutAt: { type: Date, default: null }
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

const tailorAvailabilitySchema = new Schema(
  {
    availableDays: {
      type: [String],
      enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      default: []
    },
    workingHours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" }
    },
    isAvailable: { type: Boolean, default: true }
  },
  { _id: false }
);

const tailorDetailSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    district: { type: String, trim: true, default: "Unknown" },
    documents: { type: documentSchema, default: () => ({}) },
    portfolioImages: { type: [String], default: [] },
    serviceAreas: { type: [String], default: [] },
    servicesOffered: { type: [String], default: [] },
    availabilitySchedule: { type: [availabilitySlotSchema], default: [] },
    availability: { type: tailorAvailabilitySchema, default: () => ({}) },
    skills: { type: [String], default: [] },
    shopAddress: { type: String, trim: true, default: "" },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    totalOrders: { type: Number, min: 0, default: 0 },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    earnings: { type: earningsSchema, default: () => ({}) },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "banned"],
      default: "pending"
    },
    commissionRate: { type: Number, min: 0, max: 100, default: 0 },
    rejectionCount: { type: Number, min: 0, default: 0 },
    penaltyPoints: { type: Number, min: 0, default: 0 },
    trainings: { type: [trainingSchema], default: [] },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

tailorDetailSchema.index({ approvalStatus: 1, isDeleted: 1, district: 1 });
tailorDetailSchema.index({ isApproved: 1, isDeleted: 1, updatedAt: -1 });

export const TailorDetail = mongoose.model("TailorDetail", tailorDetailSchema);

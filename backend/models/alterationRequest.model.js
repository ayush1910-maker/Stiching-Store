import mongoose, { Schema } from "mongoose";

const alterationRequestSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "StitchingOrder",
      required: true,
      index: true
    },
    images: { type: [String], default: [] },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "IN_PROGRESS", "RESOLVED"],
      default: "REQUESTED"
    },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const AlterationRequest = mongoose.model(
  "AlterationRequest",
  alterationRequestSchema
);

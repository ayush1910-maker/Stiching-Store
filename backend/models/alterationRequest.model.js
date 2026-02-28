import mongoose, { Schema } from "mongoose";

const alterationRequestSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "StitchingOrder",
      required: true
    },
    images: { type: [String], default: [] },
    reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "IN_PROGRESS", "RESOLVED"],
      default: "REQUESTED"
    },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

alterationRequestSchema.index({ orderId: 1, createdAt: -1 });
alterationRequestSchema.index({ status: 1, createdAt: -1 });

export const AlterationRequest = mongoose.model("AlterationRequest", alterationRequestSchema);

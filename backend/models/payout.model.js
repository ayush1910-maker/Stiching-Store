import mongoose, { Schema } from "mongoose";

const payoutSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", uppercase: true },
    type: { type: String, enum: ["TAILOR", "DELIVERY"], required: true },
    cycleStart: { type: Date, default: null },
    cycleEnd: { type: Date, default: null },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PROCESSED", "FAILED"],
      default: "PENDING"
    },
    payoutId: { type: String, trim: true, default: "" },
    razorpayStatus: { type: String, trim: true, default: "" },
    recipientType: { type: String, enum: ["tailor", "delivery"], default: null },
    referenceId: { type: String, trim: true, default: "" },
    earningsStatus: { type: String, enum: ["PENDING", "SETTLED", "FAILED"], default: "PENDING" },
    processedDate: { type: Date, default: null }
  },
  { timestamps: true }
);

payoutSchema.index({ userId: 1, createdAt: -1 });
payoutSchema.index({ payoutId: 1 }, { unique: true, sparse: true });

export const Payout = mongoose.model("Payout", payoutSchema);

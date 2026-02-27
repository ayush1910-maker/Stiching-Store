import mongoose, { Schema } from "mongoose";

const payoutSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["TAILOR", "DELIVERY"], required: true },
    cycleStart: { type: Date, required: true },
    cycleEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PROCESSED", "FAILED"],
      default: "PENDING"
    },
    processedDate: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Payout = mongoose.model("Payout", payoutSchema);

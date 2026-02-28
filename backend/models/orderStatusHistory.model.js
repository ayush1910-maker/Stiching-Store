import mongoose, { Schema } from "mongoose";

const historyStatusEnum = [
  "pending",
  "assigned",
  "accepted",
  "cutting",
  "stitching",
  "finishing",
  "ready",
  "ready_for_delivery",
  "delivered",
  "rejected",
  "cancelled",
  "in_progress",
  "completed",
  "alteration_requested",
  "PLACED",
  "PAYMENT_PENDING",
  "PAYMENT_COMPLETED",
  "TAILOR_ASSIGNED",
  "PICKUP_PARTNER_ASSIGNED",
  "PICKED_UP",
  "IN_STITCHING",
  "QC_PENDING",
  "READY_FOR_DISPATCH",
  "DROP_PARTNER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "ALTERATION_REQUESTED",
  "ALTERATION_IN_PROGRESS",
  "CANCELLED",
  "REFUNDED"
];

const orderStatusHistorySchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "StitchingOrder",
      required: true
    },
    status: {
      type: String,
      enum: historyStatusEnum,
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    proofImage: { type: String, trim: true, default: "" }
  },
  { timestamps: false }
);

orderStatusHistorySchema.index({ orderId: 1, timestamp: 1 });

export const OrderStatusHistory = mongoose.model("OrderStatusHistory", orderStatusHistorySchema);

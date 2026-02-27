import mongoose, { Schema } from "mongoose";

const historyStatusEnum = [
  "pending",
  "in_progress",
  "completed",
  "delivered",
  "cancelled",
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
      required: true,
      index: true
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

export const OrderStatusHistory = mongoose.model(
  "OrderStatusHistory",
  orderStatusHistorySchema
);

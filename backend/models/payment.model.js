import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    orderModel: {
      type: String,
      required: true,
      enum: ["StitchingOrder", "EcommerceOrder"]
    },
    razorpayOrderId: { type: String, trim: true, default: "" },
    razorpayPaymentId: { type: String, trim: true, default: "" },
    amount: { type: Number, required: true, min: 0 },
    paymentType: {
      type: String,
      enum: ["stitching", "ecommerce"],
      required: true
    },
    status: {
      type: String,
      enum: ["CREATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "CREATED",
      index: true
    },
    transactionDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1, orderModel: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);

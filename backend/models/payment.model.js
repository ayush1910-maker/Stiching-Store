import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    order: {
      type: Schema.Types.ObjectId,
      required: true
    },
    orderModel: {
      type: String,
      enum: ["StitchingOrder", "EcommerceOrder"],
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    orderId: {
      type: Schema.Types.ObjectId
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      default: ""
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: ""
    },
    razorpayRefundId: {
      type: String,
      trim: true,
      default: ""
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true
    },
    paymentType: {
      type: String,
      enum: ["stitching", "ecommerce"],
      default: "stitching"
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded", "CREATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "created"
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    refundStatus: {
      type: String,
      enum: ["none", "processed", "failed"],
      default: "none"
    },
    processedWebhookEvents: {
      type: [String],
      default: []
    },
    transactionDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

paymentSchema.pre("validate", function preValidate(next) {
  if (this.user && !this.userId) this.userId = this.user;
  if (this.userId && !this.user) this.user = this.userId;
  if (this.order && !this.orderId) this.orderId = this.order;
  if (this.orderId && !this.order) this.order = this.orderId;

  if (this.refundAmount > this.amount) {
    this.invalidate("refundAmount", "refundAmount cannot exceed amount");
  }

  next();
});

paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1, orderModel: 1 });
paymentSchema.index({ razorpayOrderId: 1 }, { sparse: true });
paymentSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

export const Payment = mongoose.model("Payment", paymentSchema);

import mongoose, { Schema } from "mongoose";

const ORDER_STATUS = [
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

const pricingSchema = new Schema(
  {
    basePrice: { type: Number, min: 0, default: 0 },
    deliveryCharge: { type: Number, min: 0, default: 0 },
    rushCharge: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 }
  },
  { _id: false }
);

const commissionSchema = new Schema(
  {
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    amount: { type: Number, min: 0, default: 0 }
  },
  { _id: false }
);

const stitchingOrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tailorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    deliveryPartnerPickupId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    deliveryPartnerDropId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true
    },
    deliveryType: {
      type: String,
      enum: ["normal", "express", "premium"],
      required: true
    },
    measurements: { type: Schema.Types.Mixed, default: {} },
    designImages: { type: [String], default: [] },
    specialInstructions: { type: String, trim: true, default: "" },
    fabricSource: {
      type: String,
      enum: ["CUSTOMER", "PLATFORM"],
      default: "CUSTOMER"
    },
    pickupAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true
    },
    deliveryAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true
    },
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: "pending",
      index: true
    },
    pricing: { type: pricingSchema, default: () => ({}) },
    commission: { type: commissionSchema, default: () => ({}) },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    estimatedDeliveryDate: { type: Date, default: null },
    isAlterationRequested: { type: Boolean, default: false },
    cancellationReason: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

export const StitchingOrder = mongoose.model("StitchingOrder", stitchingOrderSchema);
export { ORDER_STATUS };

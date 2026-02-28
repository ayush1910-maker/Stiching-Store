import mongoose, { Schema } from "mongoose";

const ecommerceOrderStatus = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "return_requested"
];

const returnStatusEnum = [
  "NONE",
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "return_requested"
];

const orderProductSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "EcommerceProduct",
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    size: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const ecommerceOrderSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    products: {
      type: [orderProductSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "products must contain at least one item"
      }
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING"
    },
    orderStatus: {
      type: String,
      enum: ecommerceOrderStatus,
      default: "PLACED"
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    courierTrackingId: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ecommerceOrderStatus,
      default: "PLACED"
    },
    returnStatus: {
      type: String,
      enum: returnStatusEnum,
      default: "NONE"
    },
    returnReason: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

ecommerceOrderSchema.index({ customerId: 1, createdAt: -1 });
ecommerceOrderSchema.index({ status: 1, createdAt: -1 });
ecommerceOrderSchema.index({ paymentStatus: 1, createdAt: -1 });

export const EcommerceOrder = mongoose.model("EcommerceOrder", ecommerceOrderSchema);

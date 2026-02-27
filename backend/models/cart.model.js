import mongoose, { Schema } from "mongoose";

const cartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "EcommerceProduct",
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" },
    unitPrice: { type: Number, min: 0, default: 0 }
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    items: { type: [cartItemSchema], default: [] }
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);

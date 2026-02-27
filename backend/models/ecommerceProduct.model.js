import mongoose, { Schema } from "mongoose";

const ecommerceProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: null },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    images: { type: [String], default: [] },
    stock: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const EcommerceProduct = mongoose.model(
  "EcommerceProduct",
  ecommerceProductSchema
);

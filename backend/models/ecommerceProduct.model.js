import mongoose, { Schema } from "mongoose";

const ecommerceProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    category: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: null },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    images: { type: [String], default: [] },
    stock: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ecommerceProductSchema.pre("validate", function preValidate(next) {
  if (this.discountPrice !== null && this.discountPrice > this.price) {
    this.invalidate("discountPrice", "discountPrice cannot exceed price");
  }
  next();
});

ecommerceProductSchema.index({ isDeleted: 1, isActive: 1, category: 1, createdAt: -1 });

export const EcommerceProduct = mongoose.model("EcommerceProduct", ecommerceProductSchema);

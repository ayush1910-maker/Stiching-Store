import mongoose, { Schema } from "mongoose";

const serviceCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    basePrice: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const ServiceCategory = mongoose.model(
  "ServiceCategory",
  serviceCategorySchema
);

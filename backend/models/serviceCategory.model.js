import mongoose, { Schema } from "mongoose";

const serviceCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    basePrice: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, default: "", maxlength: 1500 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

serviceCategorySchema.index({ isDeleted: 1, isActive: 1, createdAt: -1 });

export const ServiceCategory = mongoose.model("ServiceCategory", serviceCategorySchema);

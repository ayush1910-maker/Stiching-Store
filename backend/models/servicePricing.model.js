import mongoose, { Schema } from "mongoose";

const servicePricingSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true
    },
    deliveryType: {
      type: String,
      enum: ["normal", "express", "premium"],
      required: true
    },
    price: { type: Number, required: true, min: 0 },
    estimatedDays: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

servicePricingSchema.index({ categoryId: 1, deliveryType: 1 }, { unique: true });

export const ServicePricing = mongoose.model("ServicePricing", servicePricingSchema);

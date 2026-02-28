import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema(
  {
    commissionPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },
    minOrderAmount: {
      type: Number,
      required: true,
      default: 999,
      min: 0
    },
    pricingConfig: {
      type: Schema.Types.Mixed,
      default: () => ({})
    },
    deliveryTypes: {
      type: [
        {
          type: String,
          enum: ["normal", "express", "premium"]
        }
      ],
      default: ["normal", "express", "premium"]
    },
    rushCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    cancellationPolicy: {
      type: String,
      trim: true,
      default: ""
    },
    alterationPolicy: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

export const AdminSetting = mongoose.model("AdminSetting", adminSchema);

import mongoose, { Schema } from "mongoose";

const customerProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    savedAddresses: { type: [{ type: Schema.Types.ObjectId, ref: "Address" }], default: [] },
    savedMeasurements: { type: [Schema.Types.Mixed], default: [] },
    totalOrders: { type: Number, min: 0, default: 0 },
    loyaltyPoints: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

export const CustomerProfile = mongoose.model("CustomerProfile", customerProfileSchema);

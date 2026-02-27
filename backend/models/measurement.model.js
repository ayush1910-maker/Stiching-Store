import mongoose, { Schema } from "mongoose";

const measurementSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    profileName: {
      type: String,
      required: true,
      trim: true
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Measurement = mongoose.model("Measurement", measurementSchema);

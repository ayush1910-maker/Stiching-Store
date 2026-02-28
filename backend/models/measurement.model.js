import mongoose, { Schema } from "mongoose";

const measurementSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    profileName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
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

measurementSchema.index({ customerId: 1, createdAt: -1 });

export const Measurement = mongoose.model("Measurement", measurementSchema);

import mongoose, { Schema } from "mongoose";

const reviewRatingSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "StitchingOrder",
      required: true,
      index: true
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tailorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

reviewRatingSchema.index({ orderId: 1, customerId: 1 }, { unique: true });

export const ReviewRating = mongoose.model("ReviewRating", reviewRatingSchema);

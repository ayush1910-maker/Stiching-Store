import mongoose, { Schema } from "mongoose";

const reviewRatingSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "StitchingOrder",
      required: true
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tailorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "", maxlength: 1000 }
  },
  { timestamps: true }
);

reviewRatingSchema.index({ orderId: 1, customerId: 1 }, { unique: true });
reviewRatingSchema.index({ tailorId: 1, createdAt: -1 });

export const ReviewRating = mongoose.model("ReviewRating", reviewRatingSchema);

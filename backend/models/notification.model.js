import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["GENERAL", "ORDER", "PAYMENT", "PROMOTION", "SYSTEM"],
      default: "GENERAL"
    },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);

import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    message: { type: String, required: true, trim: true, minlength: 2, maxlength: 2000 },
    type: {
      type: String,
      enum: ["GENERAL", "ORDER", "PAYMENT", "PROMOTION", "SYSTEM"],
      default: "GENERAL"
    },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);

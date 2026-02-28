import mongoose, { Schema } from "mongoose";

const DELIVERY_TASK_STATUS = [
  "assigned",
  "on_the_way",
  "reached",
  "picked_up",
  "delivered",
  "cancelled"
];

const deliveryTaskSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "StitchingOrder",
      required: true
    },
    deliveryPartner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    taskType: {
      type: String,
      enum: ["pickup", "drop"],
      default: "drop"
    },
    status: {
      type: String,
      enum: DELIVERY_TASK_STATUS,
      default: "assigned"
    },
    proofImages: {
      type: [String],
      default: []
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

deliveryTaskSchema.index({ order: 1, taskType: 1 });
deliveryTaskSchema.index({ deliveryPartner: 1, status: 1, isDeleted: 1, createdAt: -1 });

export const DeliveryTask = mongoose.model("DeliveryTask", deliveryTaskSchema);
export { DELIVERY_TASK_STATUS };

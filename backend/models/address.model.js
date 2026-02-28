import mongoose, { Schema } from "mongoose";

const latLngSchema = new Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: { type: String, required: true, trim: true, minlength: 8, maxlength: 15 },
    pincode: { type: String, required: true, trim: true, minlength: 4, maxlength: 10 },
    district: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    state: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    fullAddress: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
    location: { type: latLngSchema, required: true }
  },
  { timestamps: true }
);

addressSchema.index({ userId: 1, createdAt: -1 });

export const Address = mongoose.model("Address", addressSchema);

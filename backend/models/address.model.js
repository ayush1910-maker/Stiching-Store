import mongoose, { Schema } from "mongoose";

const latLngSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    location: { type: latLngSchema, required: true }
  },
  { timestamps: true }
);

export const Address = mongoose.model("Address", addressSchema);

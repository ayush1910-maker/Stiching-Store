import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createPaymentOrderSchema = Joi.object({
  orderId: objectId.required()
});

export const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().trim().required(),
  razorpay_payment_id: Joi.string().trim().required(),
  razorpay_signature: Joi.string().trim().required()
});

export const refundPaymentSchema = Joi.object({
  paymentId: objectId.required(),
  amount: Joi.number().min(0.01).required()
});

export const payoutSchema = Joi.object({
  recipientId: objectId.required(),
  recipientType: Joi.string().valid("tailor", "delivery").required(),
  amount: Joi.number().min(1).required(),
  mode: Joi.string().valid("IMPS", "NEFT", "RTGS", "UPI").default("IMPS"),
  narration: Joi.string().trim().max(120).allow(""),
  purpose: Joi.string().trim().max(20).default("payout"),
  accountHolderName: Joi.string().trim().max(120).optional(),
  accountNumber: Joi.string().trim().max(32).optional(),
  ifscCode: Joi.string().trim().max(20).optional(),
  upiId: Joi.string().trim().max(120).optional()
});

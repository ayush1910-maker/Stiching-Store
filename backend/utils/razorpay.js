import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn("Razorpay keys are not configured in environment variables");
}

const razorpay = new Razorpay({
  key_id: keyId || "",
  key_secret: keySecret || ""
});

export const verifyRazorpayPaymentSignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
}) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expectedSignature === razorpaySignature;
};

export const verifyRazorpayWebhookSignature = ({ body, signature }) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};

export default razorpay;

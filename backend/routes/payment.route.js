import express from "express";

import verifyJWT from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createOrder,
  verifyPayment,
  refundPayment,
  payout,
  webhook
} from "../controllers/payment.controller.js";
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
  refundPaymentSchema,
  payoutSchema
} from "../validations/payment.validation.js";

const router = express.Router();

router.post("/webhook", webhook);

router.use(verifyJWT);

router.post("/create-order", authorizeRoles("customer"), validateBody(createPaymentOrderSchema), createOrder);
router.post("/verify", authorizeRoles("customer"), validateBody(verifyPaymentSchema), verifyPayment);
router.post("/refund", authorizeRoles("admin"), validateBody(refundPaymentSchema), refundPayment);
router.post("/payout", authorizeRoles("admin"), validateBody(payoutSchema), payout);

export default router;

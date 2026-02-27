import express from "express";
import Joi from "joi";

import verifyJWT from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validate.middleware.js";
import {
  getAssignedOrders,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  uploadCompletionPhotos,
  markOrderReady,
  getEarnings,
  getProfile,
  updateProfile,
  updateAvailability,
  TAILOR_ALLOWED_STATUSES
} from "../controllers/tailor.controller.js";

const router = express.Router();

const objectId = Joi.string().hex().length(24);

const ordersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid(...TAILOR_ALLOWED_STATUSES, "TAILOR_ASSIGNED", "DELIVERED")
});

const orderIdParamSchema = Joi.object({
  id: objectId.required()
});

const rejectOrderSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(300).required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("cutting", "stitching", "finishing", "ready").required()
});

const uploadPhotosSchema = Joi.object({
  photos: Joi.array().items(Joi.string().uri()).min(1).required()
});

const earningsQuerySchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().trim().min(8).max(15).allow(""),
  shopDetails: Joi.object({
    shopAddress: Joi.string().trim().max(300).allow(""),
    district: Joi.string().trim().max(120).allow("")
  }).optional(),
  skills: Joi.array().items(Joi.string().trim().min(1).max(100)).optional()
}).min(1);

const updateAvailabilitySchema = Joi.object({
  availableDays: Joi.array()
    .items(Joi.string().valid("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"))
    .required(),
  workingHours: Joi.object({
    start: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    end: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
  }).required(),
  isAvailable: Joi.boolean().required()
});

router.use(verifyJWT, authorizeRoles("tailor"));

router.get("/orders", validateQuery(ordersQuerySchema), getAssignedOrders);
router.patch("/orders/:id/accept", validateParams(orderIdParamSchema), acceptOrder);
router.patch("/orders/:id/reject", validateParams(orderIdParamSchema), validateBody(rejectOrderSchema), rejectOrder);
router.patch(
  "/orders/:id/update-status",
  validateParams(orderIdParamSchema),
  validateBody(updateStatusSchema),
  updateOrderStatus
);
router.post(
  "/orders/:id/upload-completion-photos",
  validateParams(orderIdParamSchema),
  validateBody(uploadPhotosSchema),
  uploadCompletionPhotos
);
router.patch("/orders/:id/mark-ready", validateParams(orderIdParamSchema), markOrderReady);

router.get("/earnings", validateQuery(earningsQuerySchema), getEarnings);

router.get("/profile", getProfile);
router.patch("/profile/update", validateBody(updateProfileSchema), updateProfile);
router.patch(
  "/profile/update-availability",
  validateBody(updateAvailabilitySchema),
  updateAvailability
);

export default router;

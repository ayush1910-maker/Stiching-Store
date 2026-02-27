import express from "express";
import Joi from "joi";

import verifyJWT from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery
} from "../middlewares/validate.middleware.js";
import {
  getTasks,
  markOnTheWay,
  markReached,
  markPickedUp,
  markDelivered,
  uploadProof,
  toggleStatus,
  getProfile,
  getEarnings
} from "../controllers/delivery.controller.js";

const router = express.Router();

const objectId = Joi.string().hex().length(24);

const tasksQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid("assigned", "on_the_way", "reached", "picked_up", "delivered", "cancelled")
});

const taskIdParamSchema = Joi.object({
  id: objectId.required()
});

const uploadProofSchema = Joi.object({
  images: Joi.array().items(Joi.string().uri()).min(1).required()
});

const toggleStatusSchema = Joi.object({
  isOnline: Joi.boolean().optional(),
  currentLocation: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).optional()
});

const earningsQuerySchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso()
});

router.use(verifyJWT, authorizeRoles("delivery"));

router.get("/tasks", validateQuery(tasksQuerySchema), getTasks);
router.patch("/tasks/:id/mark-on-the-way", validateParams(taskIdParamSchema), markOnTheWay);
router.patch("/tasks/:id/mark-reached", validateParams(taskIdParamSchema), markReached);
router.patch("/tasks/:id/mark-picked", validateParams(taskIdParamSchema), markPickedUp);
router.patch("/tasks/:id/mark-delivered", validateParams(taskIdParamSchema), markDelivered);
router.post("/tasks/:id/upload-proof", validateParams(taskIdParamSchema), validateBody(uploadProofSchema), uploadProof);

router.patch("/toggle-status", validateBody(toggleStatusSchema), toggleStatus);
router.get("/profile", getProfile);
router.get("/earnings", validateQuery(earningsQuerySchema), getEarnings);

export default router;

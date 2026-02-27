import express from "express";
import Joi from "joi";

import verifyJWT from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import { validate } from "../utils/validate.js";
import {
  getDashboardAnalytics,
  getRevenueReport,
  getDistrictDistribution,
  getAllTailors,
  approveTailor,
  rejectTailor,
  banTailor,
  setTailorCommission,
  assignTrainingToTailor,
  getAllOrders,
  assignTailorToOrder,
  assignDeliveryToOrder,
  reassignOrder,
  cancelOrder,
  qualityApproveOrder,
  addDeliveryPartner,
  removeDeliveryPartner,
  assignDeliveryTask,
  createService,
  updateService,
  updateServicePricing,
  addProduct,
  editProduct,
  deleteProduct,
  updateProductStock,
  processPayout,
  getPaymentTransactions,
  getGSTReport
} from "../controllers/admin.controller.js";

const router = express.Router();

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, allowUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      data: error.details.map((item) => item.message)
    });
  }
  req.query = value;
  return next();
};

const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      data: error.details.map((item) => item.message)
    });
  }
  req.params = value;
  return next();
};

const objectIdSchema = Joi.string().hex().length(24);

const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100)
});

const dateRangeQuerySchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso()
});

const tailorListQuerySchema = paginationQuerySchema.keys({
  status: Joi.string().valid("pending", "approved", "rejected", "banned"),
  search: Joi.string().trim().max(100)
});

const orderListQuerySchema = paginationQuerySchema.keys({
  status: Joi.string().trim().max(50)
});

const paymentListQuerySchema = paginationQuerySchema.keys({
  status: Joi.string().trim().max(50),
  paymentType: Joi.string().valid("stitching", "ecommerce"),
  userId: objectIdSchema,
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  search: Joi.string().trim().max(100)
});

const idParamSchema = Joi.object({
  id: objectIdSchema.required()
});

const setCommissionSchema = Joi.object({
  commissionRate: Joi.number().min(0).max(100).required()
});

const assignTrainingSchema = Joi.object({
  trainingTitle: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().min(2).max(500).required()
});

const assignTailorSchema = Joi.object({
  tailorId: objectIdSchema.required()
});

const assignDeliverySchema = Joi.object({
  deliveryPartnerId: objectIdSchema.required(),
  assignmentType: Joi.string().valid("pickup", "drop").default("pickup")
});

const reassignSchema = Joi.object({
  tailorId: objectIdSchema,
  deliveryPartnerId: objectIdSchema,
  assignmentType: Joi.string().valid("pickup", "drop")
}).or("tailorId", "deliveryPartnerId");

const cancelOrderSchema = Joi.object({
  cancellationReason: Joi.string().trim().min(2).max(300).required()
});

const addDeliveryPartnerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(32).required(),
  vehicleType: Joi.string().valid("BIKE", "SCOOTER", "BICYCLE", "CAR").required(),
  documents: Joi.object({
    aadhar: Joi.string().allow(""),
    pan: Joi.string().allow(""),
    drivingLicense: Joi.string().allow(""),
    vehicleRegistration: Joi.string().allow(""),
    policeVerification: Joi.string().allow("")
  }).optional(),
  bankDetails: Joi.object({
    accountHolderName: Joi.string().allow(""),
    accountNumber: Joi.string().allow(""),
    ifscCode: Joi.string().allow(""),
    bankName: Joi.string().allow(""),
    upiId: Joi.string().allow("")
  }).optional()
});

const assignDeliveryTaskSchema = Joi.object({
  orderId: objectIdSchema.required(),
  taskType: Joi.string().valid("pickup", "drop").required()
});

const createServiceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  basePrice: Joi.number().min(0).required(),
  description: Joi.string().trim().allow(""),
  pricing: Joi.array()
    .items(
      Joi.object({
        deliveryType: Joi.string().valid("normal", "express", "premium").required(),
        price: Joi.number().min(0).required(),
        estimatedDays: Joi.number().integer().min(1).required()
      })
    )
    .optional()
});

const updateServiceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  basePrice: Joi.number().min(0),
  description: Joi.string().trim().allow(""),
  isActive: Joi.boolean()
}).min(1);

const updateServicePricingSchema = Joi.object({
  deliveryType: Joi.string().valid("normal", "express", "premium").required(),
  price: Joi.number().min(0).required(),
  estimatedDays: Joi.number().integer().min(1).required()
});

const addProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().allow(""),
  category: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).allow(null),
  sizes: Joi.array().items(Joi.string().trim()),
  colors: Joi.array().items(Joi.string().trim()),
  images: Joi.array().items(Joi.string().uri()),
  stock: Joi.number().integer().min(0).required(),
  isActive: Joi.boolean()
});

const editProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().allow(""),
  category: Joi.string().trim(),
  price: Joi.number().min(0),
  discountPrice: Joi.number().min(0).allow(null),
  sizes: Joi.array().items(Joi.string().trim()),
  colors: Joi.array().items(Joi.string().trim()),
  images: Joi.array().items(Joi.string().uri()),
  stock: Joi.number().integer().min(0),
  isActive: Joi.boolean()
}).min(1);

const updateStockSchema = Joi.object({
  stock: Joi.number().integer().min(0).required()
});

const processPayoutSchema = Joi.object({
  userId: objectIdSchema.required(),
  amount: Joi.number().min(0).required(),
  type: Joi.string().valid("TAILOR", "DELIVERY").required(),
  cycleStart: Joi.date().iso().required(),
  cycleEnd: Joi.date().iso().required()
});

router.use(verifyJWT, authorizeRoles("admin"));

router.get("/dashboard/analytics", getDashboardAnalytics);
router.get("/dashboard/revenue-report", validateQuery(dateRangeQuerySchema), getRevenueReport);
router.get("/dashboard/district-distribution", getDistrictDistribution);

router.get("/tailors", validateQuery(tailorListQuerySchema), getAllTailors);
router.patch("/tailors/:id/approve", validateParams(idParamSchema), approveTailor);
router.patch("/tailors/:id/reject", validateParams(idParamSchema), rejectTailor);
router.patch("/tailors/:id/ban", validateParams(idParamSchema), banTailor);
router.patch(
  "/tailors/:id/set-commission",
  validateParams(idParamSchema),
  validate(setCommissionSchema),
  setTailorCommission
);
router.post(
  "/tailors/:id/assign-training",
  validateParams(idParamSchema),
  validate(assignTrainingSchema),
  assignTrainingToTailor
);

router.get("/orders", validateQuery(orderListQuerySchema), getAllOrders);
router.patch("/orders/:id/assign-tailor", validateParams(idParamSchema), validate(assignTailorSchema), assignTailorToOrder);
router.patch(
  "/orders/:id/assign-delivery",
  validateParams(idParamSchema),
  validate(assignDeliverySchema),
  assignDeliveryToOrder
);
router.patch("/orders/:id/reassign", validateParams(idParamSchema), validate(reassignSchema), reassignOrder);
router.patch("/orders/:id/cancel", validateParams(idParamSchema), validate(cancelOrderSchema), cancelOrder);
router.patch("/orders/:id/quality-approve", validateParams(idParamSchema), qualityApproveOrder);

router.post("/delivery/add-partner", validate(addDeliveryPartnerSchema), addDeliveryPartner);
router.delete("/delivery/:id/remove-partner", validateParams(idParamSchema), removeDeliveryPartner);
router.patch("/delivery/:id/assign-task", validateParams(idParamSchema), validate(assignDeliveryTaskSchema), assignDeliveryTask);

router.post("/services/create", validate(createServiceSchema), createService);
router.patch("/services/:id/update", validateParams(idParamSchema), validate(updateServiceSchema), updateService);
router.patch(
  "/services/:id/update-pricing",
  validateParams(idParamSchema),
  validate(updateServicePricingSchema),
  updateServicePricing
);

router.post("/products/add", validate(addProductSchema), addProduct);
router.patch("/products/:id/edit", validateParams(idParamSchema), validate(editProductSchema), editProduct);
router.delete("/products/:id/delete", validateParams(idParamSchema), deleteProduct);
router.patch("/products/:id/update-stock", validateParams(idParamSchema), validate(updateStockSchema), updateProductStock);

router.post("/payments/process-payout", validate(processPayoutSchema), processPayout);
router.get("/payments/transactions", validateQuery(paymentListQuerySchema), getPaymentTransactions);
router.get(
  "/payments/gst-report",
  validateQuery(dateRangeQuerySchema.keys({ gstRate: Joi.number().min(0).max(100) })),
  getGSTReport
);

export default router;

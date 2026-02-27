import express from "express";
import Joi from "joi";

import verifyJWT from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validate.middleware.js";
import {
  browseServices,
  getServiceAvailability,
  createStitchingOrder,
  uploadMeasurements,
  uploadDesign,
  trackOrder,
  requestAlteration,
  addAddress,
  getAddresses,
  saveMeasurementProfile,
  rateTailor,
  addToCart,
  removeFromCart,
  getCart,
  placeEcommerceOrder,
  requestEcommerceReturn
} from "../controllers/customer.controller.js";

const router = express.Router();

const objectId = Joi.string().hex().length(24);

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  category: Joi.string().trim().max(120)
});

const serviceAvailabilityQuery = Joi.object({
  date: Joi.date().iso().optional()
});

const createOrderSchema = Joi.object({
  serviceId: objectId.required(),
  deliveryType: Joi.string().valid("normal", "express", "premium").required(),
  pickupAddressId: objectId.required(),
  deliveryAddressId: objectId.required(),
  specialInstructions: Joi.string().trim().allow(""),
  fabricSource: Joi.string().valid("CUSTOMER", "PLATFORM").optional()
});

const orderIdParam = Joi.object({
  id: objectId.required()
});

const uploadMeasurementsSchema = Joi.object({
  measurements: Joi.object().required()
});

const uploadDesignSchema = Joi.object({
  designImageUrl: Joi.string().uri().required()
});

const requestAlterationSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(300).required(),
  images: Joi.array().items(Joi.string().uri()).optional()
});

const addAddressSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().min(8).max(15).required(),
  pincode: Joi.string().trim().min(4).max(10).required(),
  district: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().min(2).max(100).required(),
  fullAddress: Joi.string().trim().min(5).max(500).required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).required()
});

const saveMeasurementSchema = Joi.object({
  profileName: Joi.string().trim().min(2).max(120).required(),
  data: Joi.object().required(),
  isDefault: Joi.boolean().optional()
});

const rateTailorSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().trim().allow("")
});

const cartAddSchema = Joi.object({
  productId: objectId.required(),
  quantity: Joi.number().integer().min(1).required(),
  size: Joi.string().trim().allow(""),
  color: Joi.string().trim().allow("")
});

const productIdParam = Joi.object({
  productId: objectId.required()
});

const placeEcommerceOrderSchema = Joi.object({
  paymentMethod: Joi.string().valid("COD", "ONLINE").required(),
  shippingAddressId: objectId.required()
});

const ecommerceOrderParam = Joi.object({
  orderId: objectId.required()
});

const returnRequestSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(300).required()
});

const serviceIdParam = Joi.object({
  id: objectId.required()
});

router.use(verifyJWT, authorizeRoles("customer"));

router.get("/services", validateQuery(paginationQuery), browseServices);
router.get(
  "/services/:id/availability",
  validateParams(serviceIdParam),
  validateQuery(serviceAvailabilityQuery),
  getServiceAvailability
);

router.post("/orders", validateBody(createOrderSchema), createStitchingOrder);
router.post("/orders/:id/upload-measurements", validateParams(orderIdParam), validateBody(uploadMeasurementsSchema), uploadMeasurements);
router.post("/orders/:id/upload-design", validateParams(orderIdParam), validateBody(uploadDesignSchema), uploadDesign);
router.get("/orders/:id/track", validateParams(orderIdParam), trackOrder);
router.post("/orders/:id/request-alteration", validateParams(orderIdParam), validateBody(requestAlterationSchema), requestAlteration);

router.post("/address", validateBody(addAddressSchema), addAddress);
router.get("/address", getAddresses);

router.post("/measurements/save", validateBody(saveMeasurementSchema), saveMeasurementProfile);

router.post("/orders/:id/rate-tailor", validateParams(orderIdParam), validateBody(rateTailorSchema), rateTailor);

router.post("/cart/add", validateBody(cartAddSchema), addToCart);
router.delete("/cart/remove/:productId", validateParams(productIdParam), removeFromCart);
router.get("/cart", getCart);

router.post("/ecommerce/place-order", validateBody(placeEcommerceOrderSchema), placeEcommerceOrder);
router.post(
  "/ecommerce/:orderId/return-request",
  validateParams(ecommerceOrderParam),
  validateBody(returnRequestSchema),
  requestEcommerceReturn
);

export default router;

import mongoose from "mongoose";
import { ServiceCategory } from "../models/serviceCategory.model.js";
import { ServicePricing } from "../models/servicePricing.model.js";
import { StitchingOrder } from "../models/stitchingOrder.model.js";
import { Address } from "../models/address.model.js";
import { OrderStatusHistory } from "../models/orderStatusHistory.model.js";
import { AlterationRequest } from "../models/alterationRequest.model.js";
import { ReviewRating } from "../models/reviewRating.model.js";
import { Cart } from "../models/cart.model.js";
import { EcommerceProduct } from "../models/ecommerceProduct.model.js";
import { EcommerceOrder } from "../models/ecommerceOrder.model.js";
import { CustomerProfile } from "../models/customerProfile.model.js";
import { Measurement } from "../models/measurement.model.js";
import { TailorDetail } from "../models/tailorDetail.model.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createOrderId = () => `ST-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const appendOrderHistory = async (orderId, status, updatedBy, session = null) => {
  const payload = {
    orderId,
    status,
    updatedBy,
    timestamp: new Date()
  };

  if (session) {
    await OrderStatusHistory.create([payload], { session });
    return;
  }

  await OrderStatusHistory.create(payload);
};

const browseServices = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const query = { isActive: true, isDeleted: false };

    if (req.query.category) {
      query.name = { $regex: req.query.category, $options: "i" };
    }

    const [total, services] = await Promise.all([
      ServiceCategory.countDocuments(query),
      ServiceCategory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const categoryIds = services.map((item) => item._id);
    const pricing = await ServicePricing.find({ categoryId: { $in: categoryIds } });

    const pricingMap = pricing.reduce((acc, item) => {
      const key = String(item.categoryId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const items = services.map((item) => ({
      ...item.toObject(),
      pricing: pricingMap[String(item._id)] || []
    }));

    return sendSuccess(res, "Services fetched successfully", {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch services");
  }
};

const getServiceAvailability = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return sendError(res, "Invalid service id", 400);
    }

    const service = await ServiceCategory.findOne({
      _id: req.params.id,
      isActive: true,
      isDeleted: false
    });

    if (!service) {
      return sendError(res, "Service not found", 404);
    }

    const requestedDate = req.query.date ? new Date(req.query.date) : new Date();
    if (Number.isNaN(requestedDate.getTime())) {
      return sendError(res, "Invalid date", 400);
    }

    const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const day = dayMap[requestedDate.getDay()];

    const tailors = await TailorDetail.find({
      isDeleted: false,
      isApproved: true,
      approvalStatus: "approved",
      servicesOffered: { $in: [service.name] }
    }).select("availabilitySchedule userId rating");

    const slots = [];
    tailors.forEach((tailor) => {
      tailor.availabilitySchedule
        .filter((slot) => slot.day === day)
        .forEach((slot) => {
          slots.push({
            tailorId: tailor.userId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            rating: tailor.rating
          });
        });
    });

    return sendSuccess(res, "Service availability fetched successfully", {
      date: requestedDate,
      day,
      serviceId: service._id,
      availableSlots: slots
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch service availability");
  }
};

const createStitchingOrder = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { serviceId, deliveryType, pickupAddressId, deliveryAddressId, specialInstructions, fabricSource } = req.body;

    if (![serviceId, pickupAddressId, deliveryAddressId].every((id) => isValidObjectId(id))) {
      return sendError(res, "Invalid service or address id", 400);
    }

    const [service, pickupAddress, deliveryAddress, pricing] = await Promise.all([
      ServiceCategory.findOne({ _id: serviceId, isActive: true, isDeleted: false }),
      Address.findOne({ _id: pickupAddressId, userId: customerId }),
      Address.findOne({ _id: deliveryAddressId, userId: customerId }),
      ServicePricing.findOne({ categoryId: serviceId, deliveryType })
    ]);

    if (!service) return sendError(res, "Service not found", 404);
    if (!pickupAddress || !deliveryAddress) return sendError(res, "Address not found", 404);

    const basePrice = pricing?.price ?? service.basePrice;
    const totalAmount = basePrice;

    const order = await StitchingOrder.create({
      orderId: createOrderId(),
      customerId,
      category: serviceId,
      deliveryType,
      pickupAddress: pickupAddressId,
      deliveryAddress: deliveryAddressId,
      specialInstructions: specialInstructions || "",
      fabricSource: fabricSource || "CUSTOMER",
      pricing: {
        basePrice,
        deliveryCharge: 0,
        rushCharge: 0,
        discount: 0,
        tax: 0
      },
      totalAmount,
      status: "pending"
    });

    await appendOrderHistory(order._id, "pending", customerId);

    await CustomerProfile.findOneAndUpdate(
      { userId: customerId },
      { $inc: { totalOrders: 1 } },
      { upsert: true, new: true }
    );

    return sendSuccess(res, "Stitching order created successfully", order, 201);
  } catch (error) {
    return sendError(res, error.message || "Failed to create order");
  }
};

const uploadMeasurements = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!isValidObjectId(orderId)) return sendError(res, "Invalid order id", 400);

    const order = await StitchingOrder.findOne({ _id: orderId, customerId: req.user._id });
    if (!order) return sendError(res, "Order not found", 404);

    order.measurements = req.body.measurements;
    await order.save();

    return sendSuccess(res, "Measurements uploaded successfully", order);
  } catch (error) {
    return sendError(res, error.message || "Failed to upload measurements");
  }
};

const uploadDesign = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!isValidObjectId(orderId)) return sendError(res, "Invalid order id", 400);

    const order = await StitchingOrder.findOne({ _id: orderId, customerId: req.user._id });
    if (!order) return sendError(res, "Order not found", 404);

    order.designImages.push(req.body.designImageUrl);
    await order.save();

    return sendSuccess(res, "Design uploaded successfully", order);
  } catch (error) {
    return sendError(res, error.message || "Failed to upload design");
  }
};

const trackOrder = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid order id", 400);

    const order = await StitchingOrder.findOne({ _id: req.params.id, customerId: req.user._id })
      .populate("category", "name")
      .populate("tailorId", "name email")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    if (!order) return sendError(res, "Order not found", 404);

    const timeline = await OrderStatusHistory.find({ orderId: order._id })
      .populate("updatedBy", "name role")
      .sort({ timestamp: 1 });

    return sendSuccess(res, "Order tracking fetched successfully", {
      order,
      timeline
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to track order");
  }
};

const requestAlteration = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid order id", 400);

    const order = await StitchingOrder.findOne({ _id: req.params.id, customerId: req.user._id });
    if (!order) return sendError(res, "Order not found", 404);

    order.status = "alteration_requested";
    order.isAlterationRequested = true;
    await order.save();

    const alteration = await AlterationRequest.create({
      orderId: order._id,
      images: req.body.images || [],
      reason: req.body.reason,
      status: "REQUESTED"
    });

    await appendOrderHistory(order._id, "alteration_requested", req.user._id);

    return sendSuccess(res, "Alteration requested successfully", {
      order,
      alteration
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to request alteration");
  }
};

const addAddress = async (req, res) => {
  try {
    const address = await Address.create({
      userId: req.user._id,
      name: req.body.name,
      phone: req.body.phone,
      pincode: req.body.pincode,
      district: req.body.district,
      state: req.body.state,
      fullAddress: req.body.fullAddress,
      location: req.body.location
    });

    await CustomerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $addToSet: { savedAddresses: address._id } },
      { upsert: true, new: true }
    );

    return sendSuccess(res, "Address added successfully", address, 201);
  } catch (error) {
    return sendError(res, error.message || "Failed to add address");
  }
};

const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, "Addresses fetched successfully", addresses);
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch addresses");
  }
};

const saveMeasurementProfile = async (req, res) => {
  try {
    const measurement = await Measurement.create({
      customerId: req.user._id,
      profileName: req.body.profileName,
      data: req.body.data,
      isDefault: Boolean(req.body.isDefault)
    });

    await CustomerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { savedMeasurements: measurement._id } },
      { upsert: true, new: true }
    );

    return sendSuccess(res, "Measurement profile saved successfully", measurement, 201);
  } catch (error) {
    return sendError(res, error.message || "Failed to save measurement profile");
  }
};

const rateTailor = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid order id", 400);

    const order = await StitchingOrder.findOne({ _id: req.params.id, customerId: req.user._id });
    if (!order) return sendError(res, "Order not found", 404);

    const deliveredStatuses = ["delivered", "DELIVERED"];
    if (!deliveredStatuses.includes(order.status)) {
      return sendError(res, "Tailor can only be rated after delivery", 400);
    }

    if (!order.tailorId) {
      return sendError(res, "No tailor assigned to this order", 400);
    }

    const review = await ReviewRating.findOneAndUpdate(
      {
        orderId: order._id,
        customerId: req.user._id
      },
      {
        $set: {
          tailorId: order.tailorId,
          rating: req.body.rating,
          comment: req.body.review || ""
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    const stats = await ReviewRating.aggregate([
      { $match: { tailorId: order.tailorId } },
      {
        $group: {
          _id: "$tailorId",
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 }
        }
      }
    ]);

    if (stats.length) {
      await TailorDetail.findOneAndUpdate(
        { userId: order.tailorId },
        {
          $set: {
            rating: Number(stats[0].avgRating.toFixed(2))
          }
        }
      );
    }

    return sendSuccess(res, "Tailor rated successfully", review);
  } catch (error) {
    return sendError(res, error.message || "Failed to rate tailor");
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;

    if (!isValidObjectId(productId)) return sendError(res, "Invalid product id", 400);

    const product = await EcommerceProduct.findOne({
      _id: productId,
      isDeleted: false,
      isActive: true
    });

    if (!product) return sendError(res, "Product not found", 404);

    if (product.stock < quantity) {
      return sendError(res, "Insufficient stock", 400);
    }

    let cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ customerId: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => String(item.productId) === String(productId) && item.size === (size || "") && item.color === (color || "")
    );

    if (itemIndex >= 0) {
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].unitPrice = product.discountPrice || product.price;
    } else {
      cart.items.push({
        productId,
        quantity,
        size: size || "",
        color: color || "",
        unitPrice: product.discountPrice || product.price
      });
    }

    await cart.save();

    return sendSuccess(res, "Item added to cart", cart);
  } catch (error) {
    return sendError(res, error.message || "Failed to add item to cart");
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!isValidObjectId(productId)) return sendError(res, "Invalid product id", 400);

    const cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) return sendError(res, "Cart not found", 404);

    cart.items = cart.items.filter((item) => String(item.productId) !== String(productId));
    await cart.save();

    return sendSuccess(res, "Item removed from cart", cart);
  } catch (error) {
    return sendError(res, error.message || "Failed to remove item from cart");
  }
};

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user._id }).populate("items.productId");
    if (!cart) {
      return sendSuccess(res, "Cart fetched successfully", {
        items: [],
        total: 0
      });
    }

    const items = cart.items
      .filter((item) => item.productId)
      .map((item) => {
        const unitPrice = item.unitPrice || item.productId.discountPrice || item.productId.price;
        return {
          productId: item.productId._id,
          product: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          unitPrice,
          lineTotal: unitPrice * item.quantity
        };
      });

    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return sendSuccess(res, "Cart fetched successfully", {
      items,
      total
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch cart");
  }
};

const placeEcommerceOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentMethod, shippingAddressId } = req.body;
    const customerId = req.user._id;

    if (!isValidObjectId(shippingAddressId)) {
      await session.abortTransaction();
      return sendError(res, "Invalid shippingAddressId", 400);
    }

    const [cart, shippingAddress] = await Promise.all([
      Cart.findOne({ customerId }).session(session),
      Address.findOne({ _id: shippingAddressId, userId: customerId }).session(session)
    ]);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return sendError(res, "Cart is empty", 400);
    }

    if (!shippingAddress) {
      await session.abortTransaction();
      return sendError(res, "Shipping address not found", 404);
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await EcommerceProduct.find({
      _id: { $in: productIds },
      isDeleted: false,
      isActive: true
    }).session(session);

    const productMap = new Map(products.map((product) => [String(product._id), product]));

    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = productMap.get(String(cartItem.productId));
      if (!product) {
        await session.abortTransaction();
        return sendError(res, "One or more products are unavailable", 400);
      }

      if (product.stock < cartItem.quantity) {
        await session.abortTransaction();
        return sendError(res, `Insufficient stock for ${product.name}`, 400);
      }

      const unitPrice = cartItem.unitPrice || product.discountPrice || product.price;
      totalAmount += unitPrice * cartItem.quantity;

      orderItems.push({
        productId: product._id,
        quantity: cartItem.quantity,
        unitPrice,
        size: cartItem.size,
        color: cartItem.color
      });

      product.stock -= cartItem.quantity;
      await product.save({ session });
    }

    const ecommerceOrder = await EcommerceOrder.create(
      [
        {
          customerId,
          products: orderItems,
          totalAmount,
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
          shippingAddress: {
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            pincode: shippingAddress.pincode,
            district: shippingAddress.district,
            state: shippingAddress.state,
            fullAddress: shippingAddress.fullAddress
          },
          status: "PLACED"
        }
      ],
      { session }
    );

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();

    return sendSuccess(res, "Ecommerce order placed successfully", ecommerceOrder[0], 201);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to place ecommerce order");
  } finally {
    session.endSession();
  }
};

const requestEcommerceReturn = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.orderId)) return sendError(res, "Invalid order id", 400);

    const order = await EcommerceOrder.findOne({
      _id: req.params.orderId,
      customerId: req.user._id
    });

    if (!order) return sendError(res, "Order not found", 404);

    const validStatuses = ["DELIVERED"];
    if (!validStatuses.includes(order.status)) {
      return sendError(res, "Return request allowed only for delivered orders", 400);
    }

    order.status = "return_requested";
    order.returnStatus = "return_requested";
    order.returnReason = req.body.reason;
    await order.save();

    return sendSuccess(res, "Return request submitted successfully", order);
  } catch (error) {
    return sendError(res, error.message || "Failed to submit return request");
  }
};

export {
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
};

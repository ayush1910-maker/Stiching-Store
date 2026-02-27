import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { TailorDetail } from "../models/tailorDetail.model.js";
import { StitchingOrder } from "../models/stitchingOrder.model.js";
import { EcommerceOrder } from "../models/ecommerceOrder.model.js";
import { OrderStatusHistory } from "../models/orderStatusHistory.model.js";
import { DeliveryPartner } from "../models/deliveryPartner.model.js";
import { ServiceCategory } from "../models/serviceCategory.model.js";
import { ServicePricing } from "../models/servicePricing.model.js";
import { EcommerceProduct } from "../models/ecommerceProduct.model.js";
import { Payment } from "../models/payment.model.js";
import { Payout } from "../models/payout.model.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parseDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && Number.isNaN(start.getTime())) return null;
  if (end && Number.isNaN(end.getTime())) return null;

  const match = {};
  if (start || end) {
    match.transactionDate = {};
    if (start) match.transactionDate.$gte = start;
    if (end) match.transactionDate.$lte = end;
  }

  return match;
};

const addOrderHistory = async (orderId, status, updatedBy, session, proofImage = "") => {
  await OrderStatusHistory.create(
    [
      {
        orderId,
        status,
        updatedBy,
        timestamp: new Date(),
        proofImage
      }
    ],
    { session }
  );
};

const findTailorById = async (id) => {
  if (!isValidObjectId(id)) return null;
  return TailorDetail.findOne({
    isDeleted: false,
    $or: [{ _id: id }, { userId: id }]
  });
};

const findDeliveryPartnerById = async (id) => {
  if (!isValidObjectId(id)) return null;
  return DeliveryPartner.findOne({
    isDeleted: false,
    $or: [{ _id: id }, { userId: id }]
  });
};

const getDashboardAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalTailors, stitchingOrdersCount, ecommerceOrdersCount, revenueAgg] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "tailor", isActive: true, isBanned: false }),
      StitchingOrder.countDocuments(),
      EcommerceOrder.countDocuments(),
      Payment.aggregate([
        { $match: { status: "SUCCESS" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
      ])
    ]);

    const now = new Date();
    const startOfWindow = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [userGrowth, stitchingGrowth, ecommerceGrowth, revenueGrowth] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startOfWindow } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      StitchingOrder.aggregate([
        { $match: { createdAt: { $gte: startOfWindow } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      EcommerceOrder.aggregate([
        { $match: { createdAt: { $gte: startOfWindow } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: "SUCCESS",
            transactionDate: { $gte: startOfWindow }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$transactionDate" },
              month: { $month: "$transactionDate" }
            },
            amount: { $sum: "$amount" }
          }
        }
      ])
    ]);

    const monthMap = new Map();
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthMap.set(key, {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        users: 0,
        orders: 0,
        revenue: 0
      });
    }

    userGrowth.forEach((entry) => {
      const key = `${entry._id.year}-${entry._id.month}`;
      if (monthMap.has(key)) monthMap.get(key).users = entry.count;
    });

    stitchingGrowth.forEach((entry) => {
      const key = `${entry._id.year}-${entry._id.month}`;
      if (monthMap.has(key)) monthMap.get(key).orders += entry.count;
    });

    ecommerceGrowth.forEach((entry) => {
      const key = `${entry._id.year}-${entry._id.month}`;
      if (monthMap.has(key)) monthMap.get(key).orders += entry.count;
    });

    revenueGrowth.forEach((entry) => {
      const key = `${entry._id.year}-${entry._id.month}`;
      if (monthMap.has(key)) monthMap.get(key).revenue = entry.amount;
    });

    const monthlyGrowthStats = Array.from(monthMap.values()).sort(
      (a, b) => a.year - b.year || a.month - b.month
    );

    return sendSuccess(res, "Dashboard analytics fetched successfully", {
      totalUsers,
      totalTailors,
      totalOrders: stitchingOrdersCount + ecommerceOrdersCount,
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
      monthlyGrowthStats
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch dashboard analytics");
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = parseDateRange(startDate, endDate);

    if (match === null) {
      return sendError(res, "Invalid date range", 400);
    }

    match.status = "SUCCESS";

    const revenueByMonth = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$transactionDate" },
            month: { $month: "$transactionDate" }
          },
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    return sendSuccess(res, "Revenue report fetched successfully", revenueByMonth);
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch revenue report");
  }
};

const getDistrictDistribution = async (req, res) => {
  try {
    const districtDistribution = await TailorDetail.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { $ifNull: ["$district", "Unknown"] },
          tailorCount: { $sum: 1 }
        }
      },
      { $sort: { tailorCount: -1 } }
    ]);

    return sendSuccess(res, "District distribution fetched successfully", districtDistribution);
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch district distribution");
  }
};

const getAllTailors = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, search } = req.query;

    const baseMatch = { isDeleted: false };
    if (status) {
      baseMatch.approvalStatus = status;
    }

    const pipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $match: {
          "user.role": "tailor"
        }
      }
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "user.name": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
            { district: { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await TailorDetail.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit });

    const tailors = await TailorDetail.aggregate(pipeline);

    return sendSuccess(res, "Tailors fetched successfully", {
      items: tailors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch tailors");
  }
};

const approveTailor = async (req, res) => {
  try {
    const tailor = await findTailorById(req.params.id);
    if (!tailor) return sendError(res, "Tailor not found", 404);

    tailor.isApproved = true;
    tailor.approvalStatus = "approved";
    await tailor.save();

    await User.findByIdAndUpdate(tailor.userId, {
      $set: { role: "tailor", isBanned: false, isActive: true }
    });

    return sendSuccess(res, "Tailor approved successfully", tailor);
  } catch (error) {
    return sendError(res, error.message || "Failed to approve tailor");
  }
};

const rejectTailor = async (req, res) => {
  try {
    const tailor = await findTailorById(req.params.id);
    if (!tailor) return sendError(res, "Tailor not found", 404);

    tailor.isApproved = false;
    tailor.approvalStatus = "rejected";
    tailor.rejectionCount += 1;
    await tailor.save();

    return sendSuccess(res, "Tailor rejected successfully", tailor);
  } catch (error) {
    return sendError(res, error.message || "Failed to reject tailor");
  }
};

const banTailor = async (req, res) => {
  try {
    const tailor = await findTailorById(req.params.id);
    if (!tailor) return sendError(res, "Tailor not found", 404);

    tailor.isApproved = false;
    tailor.approvalStatus = "banned";
    tailor.penaltyPoints += 5;
    await tailor.save();

    await User.findByIdAndUpdate(tailor.userId, {
      $set: { isBanned: true, isActive: false }
    });

    return sendSuccess(res, "Tailor banned successfully", tailor);
  } catch (error) {
    return sendError(res, error.message || "Failed to ban tailor");
  }
};

const setTailorCommission = async (req, res) => {
  try {
    const tailor = await findTailorById(req.params.id);
    if (!tailor) return sendError(res, "Tailor not found", 404);

    tailor.commissionRate = req.body.commissionRate;
    await tailor.save();

    return sendSuccess(res, "Tailor commission updated successfully", tailor);
  } catch (error) {
    return sendError(res, error.message || "Failed to update tailor commission");
  }
};

const assignTrainingToTailor = async (req, res) => {
  try {
    const tailor = await findTailorById(req.params.id);
    if (!tailor) return sendError(res, "Tailor not found", 404);

    tailor.trainings.push({
      title: req.body.trainingTitle,
      description: req.body.description,
      assignedBy: req.user._id
    });

    await tailor.save();

    return sendSuccess(res, "Training assigned successfully", tailor);
  } catch (error) {
    return sendError(res, error.message || "Failed to assign training");
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    const [total, orders] = await Promise.all([
      StitchingOrder.countDocuments(query),
      StitchingOrder.find(query)
        .populate("customerId", "name email")
        .populate("tailorId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return sendSuccess(res, "Orders fetched successfully", {
      items: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch orders");
  }
};

const assignTailorToOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tailorId } = req.body;
    const { id } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(tailorId)) {
      await session.abortTransaction();
      return sendError(res, "Invalid orderId or tailorId", 400);
    }

    const [order, tailorUser] = await Promise.all([
      StitchingOrder.findById(id).session(session),
      User.findById(tailorId).session(session)
    ]);

    if (!order) {
      await session.abortTransaction();
      return sendError(res, "Order not found", 404);
    }

    if (!tailorUser || tailorUser.role !== "tailor" || tailorUser.isBanned) {
      await session.abortTransaction();
      return sendError(res, "Invalid tailor", 400);
    }

    order.tailorId = tailorId;
    order.status = "TAILOR_ASSIGNED";
    await order.save({ session });

    await addOrderHistory(order._id, "TAILOR_ASSIGNED", req.user._id, session);

    await session.commitTransaction();
    return sendSuccess(res, "Tailor assigned successfully", order);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to assign tailor");
  } finally {
    session.endSession();
  }
};

const assignDeliveryToOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { deliveryPartnerId, assignmentType } = req.body;
    const taskType = assignmentType || "pickup";

    if (!isValidObjectId(req.params.id) || !isValidObjectId(deliveryPartnerId)) {
      await session.abortTransaction();
      return sendError(res, "Invalid orderId or deliveryPartnerId", 400);
    }

    const [order, partner] = await Promise.all([
      StitchingOrder.findById(req.params.id).session(session),
      DeliveryPartner.findById(deliveryPartnerId).session(session)
    ]);

    if (!order) {
      await session.abortTransaction();
      return sendError(res, "Order not found", 404);
    }

    if (!partner || partner.isDeleted) {
      await session.abortTransaction();
      return sendError(res, "Delivery partner not found", 404);
    }

    let nextStatus = "PICKUP_PARTNER_ASSIGNED";
    if (taskType === "drop") {
      order.deliveryPartnerDropId = partner.userId;
      nextStatus = "DROP_PARTNER_ASSIGNED";
    } else {
      order.deliveryPartnerPickupId = partner.userId;
    }

    order.status = nextStatus;
    await order.save({ session });

    partner.assignedTasks.push({
      orderId: order._id,
      taskType: taskType === "drop" ? "drop" : "pickup",
      assignedBy: req.user._id
    });
    await partner.save({ session });

    await addOrderHistory(order._id, nextStatus, req.user._id, session);

    await session.commitTransaction();
    return sendSuccess(res, "Delivery partner assigned successfully", order);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to assign delivery partner");
  } finally {
    session.endSession();
  }
};

const reassignOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tailorId, deliveryPartnerId, assignmentType } = req.body;
    const order = await StitchingOrder.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return sendError(res, "Order not found", 404);
    }

    if (tailorId) {
      if (!isValidObjectId(tailorId)) {
        await session.abortTransaction();
        return sendError(res, "Invalid tailorId", 400);
      }

      const tailorUser = await User.findById(tailorId).session(session);
      if (!tailorUser || tailorUser.role !== "tailor" || tailorUser.isBanned) {
        await session.abortTransaction();
        return sendError(res, "Invalid tailor", 400);
      }

      order.tailorId = tailorId;
      order.status = "TAILOR_ASSIGNED";
      await addOrderHistory(order._id, "TAILOR_ASSIGNED", req.user._id, session);
    }

    if (deliveryPartnerId) {
      if (!isValidObjectId(deliveryPartnerId)) {
        await session.abortTransaction();
        return sendError(res, "Invalid deliveryPartnerId", 400);
      }

      const partner = await DeliveryPartner.findById(deliveryPartnerId).session(session);
      if (!partner || partner.isDeleted) {
        await session.abortTransaction();
        return sendError(res, "Delivery partner not found", 404);
      }

      if (assignmentType === "drop") {
        order.deliveryPartnerDropId = partner.userId;
        order.status = "DROP_PARTNER_ASSIGNED";
        await addOrderHistory(order._id, "DROP_PARTNER_ASSIGNED", req.user._id, session);
      } else {
        order.deliveryPartnerPickupId = partner.userId;
        order.status = "PICKUP_PARTNER_ASSIGNED";
        await addOrderHistory(order._id, "PICKUP_PARTNER_ASSIGNED", req.user._id, session);
      }
    }

    await order.save({ session });

    await session.commitTransaction();
    return sendSuccess(res, "Order reassigned successfully", order);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to reassign order");
  } finally {
    session.endSession();
  }
};

const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await StitchingOrder.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, "Order not found", 404);
    }

    order.status = "CANCELLED";
    order.cancellationReason = req.body.cancellationReason || "Cancelled by admin";
    await order.save({ session });

    await addOrderHistory(order._id, "CANCELLED", req.user._id, session);

    await session.commitTransaction();
    return sendSuccess(res, "Order cancelled successfully", order);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to cancel order");
  } finally {
    session.endSession();
  }
};

const qualityApproveOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await StitchingOrder.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, "Order not found", 404);
    }

    order.status = "READY_FOR_DISPATCH";
    await order.save({ session });

    await addOrderHistory(order._id, "READY_FOR_DISPATCH", req.user._id, session);

    await session.commitTransaction();
    return sendSuccess(res, "Order quality approved successfully", order);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to quality approve order");
  } finally {
    session.endSession();
  }
};

const addDeliveryPartner = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password, vehicleType, documents, bankDetails } = req.body;

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return sendError(res, "User already exists with this email", 409);
    }

    const user = await User.create(
      [
        {
          name,
          email,
          password,
          role: "delivery"
        }
      ],
      { session }
    );

    const partner = await DeliveryPartner.create(
      [
        {
          userId: user[0]._id,
          vehicleType,
          documents: documents || {},
          bankDetails: bankDetails || {}
        }
      ],
      { session }
    );

    await session.commitTransaction();

    return sendSuccess(res, "Delivery partner added successfully", {
      user: user[0],
      deliveryPartner: partner[0]
    }, 201);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to add delivery partner");
  } finally {
    session.endSession();
  }
};

const removeDeliveryPartner = async (req, res) => {
  try {
    const partner = await findDeliveryPartnerById(req.params.id);
    if (!partner) return sendError(res, "Delivery partner not found", 404);

    partner.isDeleted = true;
    await partner.save();

    await User.findByIdAndUpdate(partner.userId, {
      $set: { isActive: false, isBanned: true }
    });

    return sendSuccess(res, "Delivery partner removed successfully", partner);
  } catch (error) {
    return sendError(res, error.message || "Failed to remove delivery partner");
  }
};

const assignDeliveryTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const partner = await findDeliveryPartnerById(req.params.id);
    if (!partner) {
      await session.abortTransaction();
      return sendError(res, "Delivery partner not found", 404);
    }

    const { orderId, taskType } = req.body;

    if (!isValidObjectId(orderId)) {
      await session.abortTransaction();
      return sendError(res, "Invalid orderId", 400);
    }

    const order = await StitchingOrder.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, "Order not found", 404);
    }

    const normalizedTaskType = taskType === "drop" ? "drop" : "pickup";

    if (normalizedTaskType === "drop") {
      order.deliveryPartnerDropId = partner.userId;
      order.status = "DROP_PARTNER_ASSIGNED";
      await addOrderHistory(order._id, "DROP_PARTNER_ASSIGNED", req.user._id, session);
    } else {
      order.deliveryPartnerPickupId = partner.userId;
      order.status = "PICKUP_PARTNER_ASSIGNED";
      await addOrderHistory(order._id, "PICKUP_PARTNER_ASSIGNED", req.user._id, session);
    }

    partner.assignedTasks.push({
      orderId,
      taskType: normalizedTaskType,
      assignedBy: req.user._id
    });

    await Promise.all([
      order.save({ session }),
      partner.save({ session })
    ]);

    await session.commitTransaction();
    return sendSuccess(res, "Delivery task assigned successfully", { order, partner });
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to assign delivery task");
  } finally {
    session.endSession();
  }
};

const createService = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, basePrice, description, pricing } = req.body;

    const existingService = await ServiceCategory.findOne({ name }).session(session);
    if (existingService) {
      await session.abortTransaction();
      return sendError(res, "Service already exists", 409);
    }

    const service = await ServiceCategory.create(
      [
        {
          name,
          basePrice,
          description
        }
      ],
      { session }
    );

    if (Array.isArray(pricing) && pricing.length > 0) {
      const pricingDocs = pricing.map((item) => ({
        categoryId: service[0]._id,
        deliveryType: item.deliveryType,
        price: item.price,
        estimatedDays: item.estimatedDays
      }));

      await ServicePricing.insertMany(pricingDocs, { session });
    }

    await session.commitTransaction();
    return sendSuccess(res, "Service created successfully", service[0], 201);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to create service");
  } finally {
    session.endSession();
  }
};

const updateService = async (req, res) => {
  try {
    const service = await ServiceCategory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!service) return sendError(res, "Service not found", 404);

    return sendSuccess(res, "Service updated successfully", service);
  } catch (error) {
    return sendError(res, error.message || "Failed to update service");
  }
};

const updateServicePricing = async (req, res) => {
  try {
    const service = await ServiceCategory.findOne({ _id: req.params.id, isDeleted: false });
    if (!service) return sendError(res, "Service not found", 404);

    const { deliveryType, price, estimatedDays } = req.body;

    const pricing = await ServicePricing.findOneAndUpdate(
      { categoryId: req.params.id, deliveryType },
      {
        $set: {
          price,
          estimatedDays
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    return sendSuccess(res, "Service pricing updated successfully", pricing);
  } catch (error) {
    return sendError(res, error.message || "Failed to update service pricing");
  }
};

const addProduct = async (req, res) => {
  try {
    const product = await EcommerceProduct.create(req.body);
    return sendSuccess(res, "Product added successfully", product, 201);
  } catch (error) {
    return sendError(res, error.message || "Failed to add product");
  }
};

const editProduct = async (req, res) => {
  try {
    const product = await EcommerceProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!product) return sendError(res, "Product not found", 404);

    return sendSuccess(res, "Product updated successfully", product);
  } catch (error) {
    return sendError(res, error.message || "Failed to update product");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await EcommerceProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!product) return sendError(res, "Product not found", 404);

    return sendSuccess(res, "Product deleted successfully", product);
  } catch (error) {
    return sendError(res, error.message || "Failed to delete product");
  }
};

const updateProductStock = async (req, res) => {
  try {
    const product = await EcommerceProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { stock: req.body.stock } },
      { new: true, runValidators: true }
    );

    if (!product) return sendError(res, "Product not found", 404);

    return sendSuccess(res, "Product stock updated successfully", product);
  } catch (error) {
    return sendError(res, error.message || "Failed to update stock");
  }
};

const processPayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, amount, type, cycleStart, cycleEnd } = req.body;

    if (!isValidObjectId(userId)) {
      await session.abortTransaction();
      return sendError(res, "Invalid userId", 400);
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return sendError(res, "User not found", 404);
    }

    const payout = await Payout.create(
      [
        {
          userId,
          amount,
          type,
          cycleStart,
          cycleEnd,
          status: "PROCESSED",
          processedDate: new Date()
        }
      ],
      { session }
    );

    await session.commitTransaction();

    return sendSuccess(res, "Payout processed successfully", payout[0], 201);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to process payout");
  } finally {
    session.endSession();
  }
};

const getPaymentTransactions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, paymentType, userId, startDate, endDate, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    if (userId && isValidObjectId(userId)) query.userId = userId;

    if (startDate || endDate) {
      const range = parseDateRange(startDate, endDate);
      if (range === null) return sendError(res, "Invalid date range", 400);
      Object.assign(query, range);
    }

    if (search) {
      query.$or = [
        { razorpayOrderId: { $regex: search, $options: "i" } },
        { razorpayPaymentId: { $regex: search, $options: "i" } }
      ];
    }

    const [total, transactions] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .populate("userId", "name email role")
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return sendSuccess(res, "Payment transactions fetched successfully", {
      items: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch transactions");
  }
};

const getGSTReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const gstRate = Number(req.query.gstRate || 18);

    const match = parseDateRange(startDate, endDate);
    if (match === null) return sendError(res, "Invalid date range", 400);

    match.status = "SUCCESS";

    const payments = await Payment.find(match).select("amount paymentType transactionDate");

    const totalAmount = payments.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = Number(((totalAmount * gstRate) / 100).toFixed(2));
    const taxableAmount = Number((totalAmount - gstAmount).toFixed(2));

    const byType = payments.reduce(
      (acc, item) => {
        acc[item.paymentType] = (acc[item.paymentType] || 0) + item.amount;
        return acc;
      },
      {}
    );

    return sendSuccess(res, "GST report fetched successfully", {
      startDate: startDate || null,
      endDate: endDate || null,
      gstRate,
      transactionCount: payments.length,
      totalAmount,
      taxableAmount,
      gstAmount,
      breakupByPaymentType: byType
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch GST report");
  }
};

export {
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
};

import mongoose from "mongoose";
import { StitchingOrder } from "../models/stitchingOrder.model.js";
import { OrderStatusHistory } from "../models/orderStatusHistory.model.js";
import { TailorDetail } from "../models/tailorDetail.model.js";
import { User } from "../models/user.model.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

const TAILOR_ALLOWED_STATUSES = [
  "pending",
  "assigned",
  "accepted",
  "cutting",
  "stitching",
  "finishing",
  "ready",
  "ready_for_delivery",
  "delivered",
  "rejected"
];

const STATUS_FLOW = {
  accepted: ["cutting"],
  cutting: ["stitching"],
  stitching: ["finishing"],
  finishing: ["ready"]
};

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const appendOrderHistory = async (orderId, status, updatedBy) => {
  await OrderStatusHistory.create({
    orderId,
    status,
    updatedBy,
    timestamp: new Date()
  });
};

const normalizeAssignedStatus = (status) => {
  if (status === "TAILOR_ASSIGNED") return "assigned";
  return status;
};

const mapIncomingStatus = (status) => {
  const incoming = String(status || "").trim();

  if (!incoming) return incoming;

  const map = {
    TAILOR_ASSIGNED: "assigned",
    DELIVERED: "delivered",
    REJECTED: "rejected"
  };

  return map[incoming] || incoming;
};

const getAssignedOrders = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const query = { tailorId: req.user._id };

    if (req.query.status) {
      const status = mapIncomingStatus(req.query.status);
      query.status = status;
    }

    const [total, orders] = await Promise.all([
      StitchingOrder.countDocuments(query),
      StitchingOrder.find(query)
        .populate("customerId", "name email phone")
        .populate("pickupAddress")
        .populate("deliveryAddress")
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return sendSuccess(res, "Assigned orders fetched successfully", {
      items: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch assigned orders");
  }
};

const acceptOrder = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid order id", 400);

    const order = await StitchingOrder.findOne({
      _id: req.params.id,
      tailorId: req.user._id
    });

    if (!order) return sendError(res, "Order not found", 404);

    const currentStatus = normalizeAssignedStatus(order.status);
    if (currentStatus !== "assigned") {
      return sendError(res, "Only assigned order can be accepted", 400);
    }

    order.status = "accepted";
    await order.save();
    await appendOrderHistory(order._id, "accepted", req.user._id);

    return sendSuccess(res, "Order accepted successfully", order);
  } catch (error) {
    return sendError(res, error.message || "Failed to accept order");
  }
};

const rejectOrder = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid order id", 400);

    const order = await StitchingOrder.findOne({
      _id: req.params.id,
      tailorId: req.user._id
    });

    if (!order) return sendError(res, "Order not found", 404);

    const currentStatus = normalizeAssignedStatus(order.status);
    if (currentStatus !== "assigned") {
      return sendError(res, "Only assigned order can be rejected", 400);
    }

    order.status = "rejected";
    order.rejectionReason = req.body.reason;
    order.tailorId = null;
    await order.save();

    await appendOrderHistory(order._id, "rejected", req.user._id);

    return sendSuccess(res, "Order rejected successfully", order);
  } catch (error) {
    return sendError(res, error.message || "Failed to reject order");
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid order id", 400);

    const { status } = req.body;

    if (!["cutting", "stitching", "finishing", "ready"].includes(status)) {
      return sendError(res, "Invalid status", 400);
    }

    const order = await StitchingOrder.findOne({
      _id: req.params.id,
      tailorId: req.user._id
    });

    if (!order) return sendError(res, "Order not found", 404);

    const currentStatus = normalizeAssignedStatus(order.status);
    const allowedNextStatuses = STATUS_FLOW[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
      return sendError(
        res,
        `Invalid status transition from ${currentStatus} to ${status}`,
        400
      );
    }

    order.status = status;
    await order.save();

    await appendOrderHistory(order._id, status, req.user._id);

    return sendSuccess(res, "Order status updated successfully", order);
  } catch (error) {
    return sendError(res, error.message || "Failed to update order status");
  }
};

const uploadCompletionPhotos = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid order id", 400);

    const order = await StitchingOrder.findOne({
      _id: req.params.id,
      tailorId: req.user._id
    });

    if (!order) return sendError(res, "Order not found", 404);

    const photos = req.body.photos || [];
    order.completionPhotos = [...order.completionPhotos, ...photos];
    await order.save();

    return sendSuccess(res, "Completion photos uploaded successfully", order);
  } catch (error) {
    return sendError(res, error.message || "Failed to upload completion photos");
  }
};

const markOrderReady = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid order id", 400);

    const order = await StitchingOrder.findOne({
      _id: req.params.id,
      tailorId: req.user._id
    });

    if (!order) return sendError(res, "Order not found", 404);

    if (!["ready", "finishing"].includes(order.status)) {
      return sendError(res, "Order must be in ready/finishing state", 400);
    }

    order.status = "ready_for_delivery";
    await order.save();
    await appendOrderHistory(order._id, "ready_for_delivery", req.user._id);

    return sendSuccess(res, "Order marked ready for delivery", order);
  } catch (error) {
    return sendError(res, error.message || "Failed to mark order ready for delivery");
  }
};

const getEarnings = async (req, res) => {
  try {
    const tailorId = req.user._id;
    const match = {
      tailorId,
      status: { $in: ["delivered", "DELIVERED"] }
    };

    if (req.query.startDate || req.query.endDate) {
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

      if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
        return sendError(res, "Invalid date range", 400);
      }

      match.updatedAt = {};
      if (startDate) match.updatedAt.$gte = startDate;
      if (endDate) match.updatedAt.$lte = endDate;
    }

    const [tailorDetail, orders] = await Promise.all([
      TailorDetail.findOne({ userId: tailorId, isDeleted: false }),
      StitchingOrder.find(match).select("price totalAmount commission updatedAt")
    ]);

    const commissionRate = tailorDetail?.commissionRate || 0;

    let totalGrossEarnings = 0;
    let totalCommissionDeduction = 0;
    let totalNetEarnings = 0;

    const monthlyMap = new Map();

    orders.forEach((order) => {
      const orderAmount = order.price > 0 ? order.price : order.totalAmount;
      const commissionAmount =
        order.commission?.amount > 0
          ? order.commission.amount
          : Number(((orderAmount * commissionRate) / 100).toFixed(2));
      const net = Number((orderAmount - commissionAmount).toFixed(2));

      totalGrossEarnings += orderAmount;
      totalCommissionDeduction += commissionAmount;
      totalNetEarnings += net;

      const date = new Date(order.updatedAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          gross: 0,
          commission: 0,
          net: 0,
          orders: 0
        });
      }

      const entry = monthlyMap.get(key);
      entry.gross += orderAmount;
      entry.commission += commissionAmount;
      entry.net += net;
      entry.orders += 1;
    });

    const monthlyBreakdown = Array.from(monthlyMap.values())
      .map((item) => ({
        ...item,
        gross: Number(item.gross.toFixed(2)),
        commission: Number(item.commission.toFixed(2)),
        net: Number(item.net.toFixed(2))
      }))
      .sort((a, b) => a.year - b.year || a.month - b.month);

    return sendSuccess(res, "Earnings fetched successfully", {
      commissionRate,
      totalOrders: orders.length,
      totalGrossEarnings: Number(totalGrossEarnings.toFixed(2)),
      totalCommissionDeduction: Number(totalCommissionDeduction.toFixed(2)),
      totalNetEarnings: Number(totalNetEarnings.toFixed(2)),
      monthlyBreakdown
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch earnings");
  }
};

const getProfile = async (req, res) => {
  try {
    const [user, tailorDetail] = await Promise.all([
      User.findById(req.user._id).select("name email phone role"),
      TailorDetail.findOne({ userId: req.user._id, isDeleted: false })
    ]);

    if (!user) return sendError(res, "Tailor not found", 404);

    return sendSuccess(res, "Tailor profile fetched successfully", {
      user,
      tailorDetail
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch profile");
  }
};

const updateProfile = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, phone, shopDetails, skills } = req.body;

    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      return sendError(res, "Tailor not found", 404);
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    await user.save({ session });

    let tailorDetail = await TailorDetail.findOne({ userId: req.user._id, isDeleted: false }).session(session);

    if (!tailorDetail) {
      const [created] = await TailorDetail.create(
        [
          {
            userId: req.user._id,
            approvalStatus: "pending"
          }
        ],
        { session }
      );
      tailorDetail = created;
    }

    if (shopDetails?.shopAddress !== undefined) {
      tailorDetail.shopAddress = shopDetails.shopAddress;
    }

    if (shopDetails?.district !== undefined) {
      tailorDetail.district = shopDetails.district;
    }

    if (Array.isArray(skills)) {
      tailorDetail.skills = skills;
    }

    await tailorDetail.save({ session });

    await session.commitTransaction();

    return sendSuccess(res, "Tailor profile updated successfully", {
      user,
      tailorDetail
    });
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to update profile");
  } finally {
    session.endSession();
  }
};

const updateAvailability = async (req, res) => {
  try {
    const { availableDays, workingHours, isAvailable } = req.body;

    let tailorDetail = await TailorDetail.findOne({ userId: req.user._id, isDeleted: false });

    if (!tailorDetail) {
      tailorDetail = await TailorDetail.create({
        userId: req.user._id,
        approvalStatus: "pending"
      });
    }

    tailorDetail.availability = {
      availableDays,
      workingHours,
      isAvailable
    };

    tailorDetail.availabilitySchedule = (availableDays || []).map((day) => ({
      day,
      startTime: workingHours.start,
      endTime: workingHours.end
    }));

    await tailorDetail.save();

    return sendSuccess(res, "Availability updated successfully", tailorDetail);
  } catch (error) {
    return sendError(res, error.message || "Failed to update availability");
  }
};

export {
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
};

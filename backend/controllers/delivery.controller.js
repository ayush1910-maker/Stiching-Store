import mongoose from "mongoose";
import { DeliveryTask } from "../models/deliveryTask.model.js";
import { DeliveryPartner } from "../models/deliveryPartner.model.js";
import { StitchingOrder } from "../models/stitchingOrder.model.js";
import { OrderStatusHistory } from "../models/orderStatusHistory.model.js";
import { User } from "../models/user.model.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

const DELIVERY_STATUS_FLOW = {
  assigned: ["on_the_way"],
  on_the_way: ["reached"],
  reached: ["picked_up"],
  picked_up: ["delivered"]
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const appendOrderHistory = async (orderId, status, updatedBy) => {
  await OrderStatusHistory.create({
    orderId,
    status,
    updatedBy,
    timestamp: new Date()
  });
};

const updateTaskStatus = async (task, nextStatus, userId, resMessage) => {
  const allowed = DELIVERY_STATUS_FLOW[task.status] || [];

  if (!allowed.includes(nextStatus)) {
    throw new Error(`Invalid status transition from ${task.status} to ${nextStatus}`);
  }

  task.status = nextStatus;
  await task.save();

  return {
    success: true,
    message: resMessage,
    data: task
  };
};

const getTasks = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const query = {
      deliveryPartner: req.user._id,
      isDeleted: false
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const [total, tasks] = await Promise.all([
      DeliveryTask.countDocuments(query),
      DeliveryTask.find(query)
        .populate({
          path: "order",
          populate: [
            { path: "customerId", select: "name phone email" },
            { path: "pickupAddress" },
            { path: "deliveryAddress" }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return sendSuccess(res, "Delivery tasks fetched successfully", {
      items: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch tasks");
  }
};

const markOnTheWay = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid task id", 400);

    const task = await DeliveryTask.findOne({
      _id: req.params.id,
      deliveryPartner: req.user._id,
      isDeleted: false
    });

    if (!task) return sendError(res, "Task not found", 404);

    if (task.status !== "assigned") {
      return sendError(res, "Task can be marked on_the_way only from assigned state", 400);
    }

    const result = await updateTaskStatus(task, "on_the_way", req.user._id, "Task marked on the way");
    return sendSuccess(res, result.message, result.data);
  } catch (error) {
    return sendError(res, error.message || "Failed to update task status");
  }
};

const markReached = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid task id", 400);

    const task = await DeliveryTask.findOne({
      _id: req.params.id,
      deliveryPartner: req.user._id,
      isDeleted: false
    });

    if (!task) return sendError(res, "Task not found", 404);

    if (task.status !== "on_the_way") {
      return sendError(res, "Task can be marked reached only from on_the_way state", 400);
    }

    const result = await updateTaskStatus(task, "reached", req.user._id, "Task marked reached");
    return sendSuccess(res, result.message, result.data);
  } catch (error) {
    return sendError(res, error.message || "Failed to update task status");
  }
};

const markPickedUp = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid task id", 400);

    const task = await DeliveryTask.findOne({
      _id: req.params.id,
      deliveryPartner: req.user._id,
      isDeleted: false
    });

    if (!task) return sendError(res, "Task not found", 404);

    if (task.status !== "reached") {
      return sendError(res, "Task can be marked picked_up only from reached state", 400);
    }

    const result = await updateTaskStatus(task, "picked_up", req.user._id, "Task marked picked up");

    if (task.order) {
      const order = await StitchingOrder.findById(task.order);
      if (order) {
        order.status = "picked_up";
        await order.save();
        await appendOrderHistory(order._id, "picked_up", req.user._id);
      }
    }

    return sendSuccess(res, result.message, result.data);
  } catch (error) {
    return sendError(res, error.message || "Failed to update task status");
  }
};

const markDelivered = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!isValidObjectId(req.params.id)) {
      await session.abortTransaction();
      return sendError(res, "Invalid task id", 400);
    }

    const task = await DeliveryTask.findOne({
      _id: req.params.id,
      deliveryPartner: req.user._id,
      isDeleted: false
    }).session(session);

    if (!task) {
      await session.abortTransaction();
      return sendError(res, "Task not found", 404);
    }

    if (task.status !== "picked_up") {
      await session.abortTransaction();
      return sendError(res, "Task can be marked delivered only from picked_up state", 400);
    }

    if (!task.proofImages || task.proofImages.length === 0) {
      await session.abortTransaction();
      return sendError(res, "Upload proof image before marking delivered", 400);
    }

    task.status = "delivered";
    await task.save({ session });

    const order = await StitchingOrder.findById(task.order).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, "Related order not found", 404);
    }

    order.status = "delivered";
    await order.save({ session });

    await OrderStatusHistory.create(
      [
        {
          orderId: order._id,
          status: "delivered",
          updatedBy: req.user._id,
          timestamp: new Date(),
          proofImage: task.proofImages[task.proofImages.length - 1] || ""
        }
      ],
      { session }
    );

    await DeliveryPartner.findOneAndUpdate(
      { userId: req.user._id, isDeleted: false },
      { $inc: { totalDeliveries: 1 } },
      { session }
    );

    await session.commitTransaction();

    return sendSuccess(res, "Task marked delivered successfully", task);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to mark task delivered");
  } finally {
    session.endSession();
  }
};

const uploadProof = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return sendError(res, "Invalid task id", 400);

    const task = await DeliveryTask.findOne({
      _id: req.params.id,
      deliveryPartner: req.user._id,
      isDeleted: false
    });

    if (!task) return sendError(res, "Task not found", 404);

    task.proofImages = [...task.proofImages, ...(req.body.images || [])];
    await task.save();

    return sendSuccess(res, "Delivery proof uploaded successfully", task);
  } catch (error) {
    return sendError(res, error.message || "Failed to upload proof");
  }
};

const toggleStatus = async (req, res) => {
  try {
    const detail = await DeliveryPartner.findOne({ userId: req.user._id, isDeleted: false });
    if (!detail) return sendError(res, "Delivery profile not found", 404);

    if (typeof req.body.isOnline === "boolean") {
      detail.isOnline = req.body.isOnline;
    } else {
      detail.isOnline = !detail.isOnline;
    }

    if (req.body.currentLocation) {
      detail.currentLocation = req.body.currentLocation;
    }

    await detail.save();

    return sendSuccess(res, "Delivery status updated successfully", {
      isOnline: detail.isOnline,
      currentLocation: detail.currentLocation
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to toggle availability");
  }
};

const getProfile = async (req, res) => {
  try {
    const [user, detail] = await Promise.all([
      User.findById(req.user._id).select("name email phone role"),
      DeliveryPartner.findOne({ userId: req.user._id, isDeleted: false })
    ]);

    if (!user || !detail) return sendError(res, "Delivery profile not found", 404);

    return sendSuccess(res, "Delivery profile fetched successfully", {
      user,
      detail
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch profile");
  }
};

const getEarnings = async (req, res) => {
  try {
    const taskQuery = {
      deliveryPartner: req.user._id,
      status: "delivered",
      isDeleted: false
    };

    if (req.query.startDate || req.query.endDate) {
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

      if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
        return sendError(res, "Invalid date range", 400);
      }

      taskQuery.updatedAt = {};
      if (startDate) taskQuery.updatedAt.$gte = startDate;
      if (endDate) taskQuery.updatedAt.$lte = endDate;
    }

    const deliveredTasks = await DeliveryTask.find(taskQuery).select("updatedAt");

    const detail = await DeliveryPartner.findOne({ userId: req.user._id, isDeleted: false }).select("totalDeliveries");

    const perDeliveryRate = Number(process.env.DELIVERY_PER_TASK_EARNING || 50);
    const totalDeliveries = deliveredTasks.length;
    const totalEarnings = totalDeliveries * perDeliveryRate;

    const monthlyMap = new Map();
    deliveredTasks.forEach((task) => {
      const d = new Date(task.updatedAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          deliveries: 0,
          earnings: 0
        });
      }

      const entry = monthlyMap.get(key);
      entry.deliveries += 1;
      entry.earnings += perDeliveryRate;
    });

    const monthlyBreakdown = Array.from(monthlyMap.values()).sort(
      (a, b) => a.year - b.year || a.month - b.month
    );

    return sendSuccess(res, "Delivery earnings fetched successfully", {
      profileTotalDeliveries: detail?.totalDeliveries || 0,
      filteredDeliveries: totalDeliveries,
      perDeliveryRate,
      totalEarnings,
      monthlyBreakdown
    });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch earnings");
  }
};

export {
  getTasks,
  markOnTheWay,
  markReached,
  markPickedUp,
  markDelivered,
  uploadProof,
  toggleStatus,
  getProfile,
  getEarnings
};
